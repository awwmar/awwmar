# Publish this profile

1. On GitHub, create a **public** repository named exactly `awwmar`. Initialize it empty.
2. Review the featured-project descriptions and adjust any claims or technology tags that are not exact.
3. Preview the generated card locally with `npm run update-stats`.
4. Push this folder's contents to the `main` branch of `awwmar/awwmar`.
5. In **Settings → Actions → General → Workflow permissions**, enable **Read and write permissions** so the scheduled updater can commit the SVG.
6. Pin your best 4–6 repositories from **Profile → Customize your pins**. Prefer finished projects with demos, screenshots, tests, and strong READMEs.
7. When your résumé has a stable public URL, add its button beside Email and LinkedIn near the top of `README.md`.

## Before sharing with recruiters

- Use a clear headshot or intentional avatar.
- Add location, a professional one-line bio, and a contact link in GitHub profile settings.
- Replace placeholders; broken buttons are worse than no buttons.
- Keep only skills you can discuss confidently in an interview.
- Add concrete project outcomes (accuracy, latency, users, dataset size, or time saved) where truthful.
- Make sure every pinned repository has setup instructions and no committed secrets or large generated files.

## Troubleshooting live stats

Run the workflow manually from the **Actions** tab after the first push. LeetCode and Codeforces expose machine-readable data; GeeksforGeeks does not provide a stable public API, so its scraper may need adjustment if their profile markup changes. A failed platform is displayed as temporarily unavailable while the other cards continue working.
