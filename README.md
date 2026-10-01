# Worldwide Kids

A family web app where children aged 5 to 14 meet a new country a few times a week. Each country is introduced by a made-up guide child of the same age, on ten photo cards, followed by a short quiz and a passport stamp. Each new week starts with a review of the countries from before.

Version 1 covers ten countries: Japan, India, Kenya, Egypt, Brazil, Peru, Mexico, Iceland, Italy and Australia.

## Run it

Needs Node.js 24 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000 and follow the parent setup.

Without an API key the app runs in sample mode, with simple built-in text. For lessons written for each child's age, copy `.env.local.example` to `.env.local`, add your `ANTHROPIC_API_KEY`, and restart.

Profiles and progress are stored in `worldwide-kids.db` in the project folder.

## Tests

```bash
npm test
```

## Credits

Photos are loaded from Wikimedia Commons and credited on each card (public domain, CC0, CC BY and CC BY-SA only). Maps use Natural Earth data (public domain).
