from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
import nltk
from textblob import TextBlob
import language_tool_python
from gensim.summarization import summarize
from sklearn.feature_extraction.text import TfidfVectorizer
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize NLP tools
try:
    nlp = spacy.load('en_core_web_sm')
except:
    print("Downloading spaCy model...")
    os.system('python -m spacy download en_core_web_sm')
    nlp = spacy.load('en_core_web_sm')

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('averaged_perceptron_tagger')

# Initialize grammar checker
tool = language_tool_python.LanguageTool('en-US')

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'OK', 'service': 'AI Proofreading Service'})

@app.route('/analyze', methods=['POST'])
def analyze_text():
    """Comprehensive text analysis with grammar, style, and content suggestions"""
    try:
        data = request.get_json()
        text = data.get('text', '')

        if not text or len(text.strip()) == 0:
            return jsonify({'error': 'No text provided'}), 400

        suggestions = []

        # Grammar check
        grammar_matches = tool.check(text)
        for match in grammar_matches[:10]:  # Limit to top 10
            suggestions.append({
                'type': 'Grammar',
                'message': match.message,
                'replacement': match.replacements[0] if match.replacements else None,
                'context': match.context,
                'offset': match.offset,
                'length': match.errorLength
            })

        # Sentiment analysis
        blob = TextBlob(text)
        sentiment = blob.sentiment.polarity
        
        if sentiment < -0.3:
            suggestions.append({
                'type': 'Tone',
                'message': 'The text has a negative tone. Consider using more positive language.',
                'replacement': None
            })
        elif sentiment > 0.5:
            suggestions.append({
                'type': 'Tone',
                'message': 'The text has a very positive tone. Ensure it maintains professionalism.',
                'replacement': None
            })

        # Readability check
        doc = nlp(text)
        sentences = list(doc.sents)
        avg_sentence_length = sum(len(sent) for sent in sentences) / len(sentences) if sentences else 0

        if avg_sentence_length > 25:
            suggestions.append({
                'type': 'Readability',
                'message': 'Average sentence length is high. Consider breaking long sentences into shorter ones.',
                'replacement': None
            })

        # Check for passive voice
        passive_count = 0
        for sent in sentences:
            for token in sent:
                if token.dep_ == 'nsubjpass':
                    passive_count += 1
        
        if passive_count > len(sentences) * 0.3:
            suggestions.append({
                'type': 'Style',
                'message': 'High use of passive voice detected. Consider using active voice for clarity.',
                'replacement': None
            })

        # Word count and complexity
        words = [token.text for token in doc if not token.is_punct and not token.is_space]
        unique_words = set([token.lemma_.lower() for token in doc if token.is_alpha])
        
        suggestions.append({
            'type': 'Statistics',
            'message': f'Word count: {len(words)} | Unique words: {len(unique_words)} | Sentences: {len(sentences)}',
            'replacement': None
        })

        return jsonify({
            'suggestions': suggestions,
            'sentiment': {
                'polarity': sentiment,
                'subjectivity': blob.sentiment.subjectivity
            },
            'stats': {
                'word_count': len(words),
                'sentence_count': len(sentences),
                'avg_sentence_length': round(avg_sentence_length, 2)
            }
        })

    except Exception as e:
        print(f"Error in analyze_text: {str(e)}")
        return jsonify({'error': str(e), 'suggestions': []}), 500

@app.route('/grammar', methods=['POST'])
def check_grammar():
    """Grammar and spelling check"""
    try:
        data = request.get_json()
        text = data.get('text', '')

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        matches = tool.check(text)
        suggestions = []

        for match in matches:
            suggestions.append({
                'message': match.message,
                'replacements': match.replacements[:3],  # Top 3 suggestions
                'context': match.context,
                'offset': match.offset,
                'length': match.errorLength,
                'rule': match.ruleId,
                'category': match.category
            })

        return jsonify({'suggestions': suggestions})

    except Exception as e:
        print(f"Error in check_grammar: {str(e)}")
        return jsonify({'error': str(e), 'suggestions': []}), 500

@app.route('/recommend', methods=['POST'])
def recommend_content():
    """Generate content recommendations and keyword extraction"""
    try:
        data = request.get_json()
        text = data.get('text', '')

        if not text or len(text.strip()) < 50:
            return jsonify({'error': 'Text too short for recommendations'}), 400

        doc = nlp(text)
        
        # Extract key phrases
        key_phrases = []
        for chunk in doc.noun_chunks:
            if len(chunk.text.split()) > 1:
                key_phrases.append(chunk.text)

        # Extract named entities
        entities = []
        for ent in doc.ents:
            entities.append({
                'text': ent.text,
                'label': ent.label_
            })

        # TF-IDF for keywords
        sentences = [sent.text for sent in doc.sents]
        if len(sentences) > 1:
            vectorizer = TfidfVectorizer(max_features=10, stop_words='english')
            tfidf_matrix = vectorizer.fit_transform(sentences)
            keywords = vectorizer.get_feature_names_out().tolist()
        else:
            keywords = []

        recommendations = []
        
        # Content structure recommendations
        if len(list(doc.sents)) < 3:
            recommendations.append({
                'type': 'Structure',
                'message': 'Consider expanding your content with more detailed explanations.'
            })

        if not any(ent.label_ in ['PERSON', 'ORG', 'GPE'] for ent in doc.ents):
            recommendations.append({
                'type': 'Content',
                'message': 'Adding specific names, organizations, or locations can make your content more concrete.'
            })

        return jsonify({
            'recommendations': recommendations,
            'key_phrases': list(set(key_phrases))[:10],
            'entities': entities[:10],
            'keywords': keywords
        })

    except Exception as e:
        print(f"Error in recommend_content: {str(e)}")
        return jsonify({'error': str(e), 'recommendations': []}), 500

@app.route('/summarize', methods=['POST'])
def summarize_text():
    """Generate text summary"""
    try:
        data = request.get_json()
        text = data.get('text', '')

        if not text or len(text.strip()) < 100:
            return jsonify({'error': 'Text too short for summarization'}), 400

        # Use extractive summarization
        try:
            summary = summarize(text, ratio=0.3)
            if not summary:
                # Fallback: return first few sentences
                doc = nlp(text)
                sentences = list(doc.sents)
                summary = ' '.join([sent.text for sent in sentences[:3]])
        except:
            # Fallback for short texts
            doc = nlp(text)
            sentences = list(doc.sents)
            summary = ' '.join([sent.text for sent in sentences[:min(3, len(sentences))]])

        return jsonify({
            'summary': summary,
            'original_length': len(text.split()),
            'summary_length': len(summary.split())
        })

    except Exception as e:
        print(f"Error in summarize_text: {str(e)}")
        return jsonify({'error': str(e), 'summary': ''}), 500

@app.route('/style-check', methods=['POST'])
def check_style():
    """Check writing style and provide improvements"""
    try:
        data = request.get_json()
        text = data.get('text', '')

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        doc = nlp(text)
        suggestions = []

        # Check for repetitive words
        words = [token.lemma_.lower() for token in doc if token.is_alpha and not token.is_stop]
        word_freq = {}
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1

        repetitive = [word for word, count in word_freq.items() if count > 3]
        if repetitive:
            suggestions.append({
                'type': 'Word Choice',
                'message': f'Words used frequently: {", ".join(repetitive[:5])}. Consider using synonyms.',
            })

        # Check sentence variety
        sentence_starts = [str(sent[0]) for sent in doc.sents if len(sent) > 0]
        if len(set(sentence_starts)) < len(sentence_starts) * 0.7:
            suggestions.append({
                'type': 'Sentence Variety',
                'message': 'Many sentences start similarly. Vary your sentence beginnings for better flow.',
            })

        # Check for adverbs
        adverbs = [token.text for token in doc if token.pos_ == 'ADV']
        if len(adverbs) > len(words) * 0.05:
            suggestions.append({
                'type': 'Style',
                'message': f'High use of adverbs ({len(adverbs)}). Consider using stronger verbs instead.',
            })

        return jsonify({'suggestions': suggestions})

    except Exception as e:
        print(f"Error in check_style: {str(e)}")
        return jsonify({'error': str(e), 'suggestions': []}), 500

if __name__ == '__main__':
    port = int(os.getenv('AI_SERVICE_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
