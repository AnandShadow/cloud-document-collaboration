const express = require('express');
const router = express.Router();
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;

// Configure GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || "http://localhost:5000/auth/github/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('GitHub authentication successful:', profile.username);
        
        const user = {
            id: profile.id,
            username: profile.username,
            displayName: profile.displayName || profile.username,
            email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
            avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
            profileUrl: profile.profileUrl,
            githubToken: accessToken
        };
        
        return done(null, user);
    } catch (error) {
        console.error('GitHub auth error:', error);
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

router.get('/github', passport.authenticate('github', { 
    scope: ['user:email'] 
}));

router.get('/github/callback', 
    passport.authenticate('github', { failureRedirect: '/' }),
    (req, res) => {
        console.log('User authenticated:', req.user.username);
        res.redirect('/?authenticated=true');
    }
);

router.get('/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: req.user
        });
    } else {
        res.json({
            authenticated: false,
            user: null
        });
    }
});

router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        req.session.destroy();
        res.json({ message: 'Logged out successfully' });
    });
});

module.exports = router;
