# v140 — Workers Free asset budget

- Cloudflare build log reported20,006 static files versus the Workers Free limit20,000. Deployment failed during asset-upload-session, not during game compilation.
- Exclude the complete docs directory from static deployment. Source docs remain in GitHub. Runtime HTML / scripts / Worker / service worker have no docs dependency.
- Keep all gameplay art, sprites, maps, sounds and font resources.
- Add tools/check-asset-budget.mjs to check tracked files against .assetsignore before adding sprite families.
- Previous Auto / stage / market changes remain included. Actual on-device Safari verification still requires an iPhone; responsive browser verification is performed after deployment.
