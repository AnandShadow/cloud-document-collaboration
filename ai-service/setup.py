import spacy
import nltk
import sys

def setup_ai_service():
    """Download and setup required NLP models and data"""
    print("Setting up AI service dependencies...")
    
    # Download spaCy model
    try:
        spacy.load('en_core_web_sm')
        print("✓ spaCy model already installed")
    except:
        print("Downloading spaCy English model...")
        import os
        os.system(f'{sys.executable} -m spacy download en_core_web_sm')
        print("✓ spaCy model installed")
    
    # Download NLTK data
    print("Downloading NLTK data...")
    try:
        nltk.data.find('tokenizers/punkt')
        print("✓ NLTK punkt already installed")
    except LookupError:
        nltk.download('punkt')
        print("✓ NLTK punkt installed")
    
    try:
        nltk.data.find('corpora/stopwords')
        print("✓ NLTK stopwords already installed")
    except LookupError:
        nltk.download('stopwords')
        print("✓ NLTK stopwords installed")
    
    try:
        nltk.data.find('taggers/averaged_perceptron_tagger')
        print("✓ NLTK POS tagger already installed")
    except LookupError:
        nltk.download('averaged_perceptron_tagger')
        print("✓ NLTK POS tagger installed")
    
    print("\n✅ AI service setup complete!")

if __name__ == '__main__':
    setup_ai_service()
