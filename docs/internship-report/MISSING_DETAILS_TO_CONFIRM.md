# Details to confirm before submission

Report: `SHOPSPHERE_TEAM_INTERNSHIP_REPORT.docx`, a joint report by Ctrl+Alt+Win and Femme Forces for TechPower Solutions (30 pages including the cover)

## Documents that were not supplied (not included in the report)
1. **Internship completion certificate from TechPower Solutions.** The reference report only had Sai Saran's offer letter. Nothing was copied or invented. Add Reyhaan's own certificate or offer letter as an annexure if the department needs it. That adds 1–2 pages, which keeps the report within the 30-page limit only if it is a single page.
2. **Bonafide certificate signed by the HOD or guide.** Add this if the department's format needs it. The reference report did not have one.
3. The Declaration page was removed at your request.

## Facts taken from the reference report that need checking
4. **Internship domain "MERN Stack Development".** This comes from Sai's offer letter. Confirm that Reyhaan's offer used the same domain.
5. **Names of college officials in the Acknowledgement.** These were copied from Sai's report (Chairman, MD, ED, Principal, HOD). Check that they are current.
6. **Internal or external guide names.** None were in the reference report, so none appear. Add them if your format needs them.
7. **Project title wording.** "Multi-Vendor *Social* E-Commerce Platform" was used as you asked. The repository README calls it "Multi-Vendor E-Commerce Platform", and the only social feature in the code is product reviews.

## Authorship questions (Chapter 7)
8. The Harini-G-07 commits are no longer mentioned in the report, as requested. Niraimathi V is listed as a supporting contributor.
9. **AI assistance.** Many commits carry AI co-author trailers, including some of Reyhaan's, and some are authored as "Claude". The report says so neutrally in Sections 2.5 and 7.2. Check your college's policy on disclosing AI tools.
10. **The work-allocation calendar** (15 Jul – 14 Sep 2026) describes itself as a *proposed retrospective allocation*. The report presents it only as an allocation summary. Confirm it with teammates and your supervisor.

## Limits of the evidence
11. **Screenshots and tests are from 21 Oct 2026.** They were taken on the current `main` branch (commit `8f85bbd`), which includes PR #3, merged on 20 Oct 2026 after the internship ended. Features added in that commit are marked † in Chapter 5. Replace the screenshots if your department needs captures from the internship period.
12. **Product photos are missing from the screenshots.** The image CDN (images.unsplash.com) was blocked in the capture environment, so placeholder or alt text shows instead.
13. **Razorpay prepaid checkout was not tested.** No test keys were available. Only Cash-on-Delivery mode was verified.
14. **Security gaps:** the unauthenticated order and delivery-partner reads were fixed in the final review (report Section 6.4). The limitations left in Section 8.3 are design-level (token storage, open CORS, no rate limiting).
15. **DEMO_LOGINS.md is wrong for admin-16 to admin-20.** Those five accounts don't exist in the seed data. Appendix A of the report lists the accounts that actually work.

## Files in this folder
- `SHOPSPHERE_TEAM_INTERNSHIP_REPORT.docx`: the editable report
- `SHOPSPHERE_TEAM_INTERNSHIP_REPORT.pdf`: PDF export (rendered with LibreOffice, so fonts may differ slightly from Word)
- `assets/screenshots/`: 20 screenshots from the running app (16 are used in the report)
- `assets/diagrams/`: 6 diagrams drawn from the repository
- `assets/logos/`: the TechPower and SJCE logos extracted from the reference report
- `test-logs/`: raw output of the repository test scripts and the auth checks
