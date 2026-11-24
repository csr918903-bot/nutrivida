# Architecture rules

- Rank all matching chatbot triggers by word count, then trigger length, with source order breaking ties; this prevents generic keywords from hiding specific requests in both typed messages and suggestions.
- Keep image validation and browser-side compression in a shared helper; optional post images use Storage when configured and compressed data URLs locally so existing text-only posts remain compatible.
- Render post photos with the shared PostImage component in community and public profiles to keep framing and missing-image behavior consistent.