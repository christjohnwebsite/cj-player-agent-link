# CJ Cyber Links — Cyber Neon Blue

Static website for Cloudflare Pages with separate Player and Agent pages, Supabase login, and an admin panel for adding/editing/deleting links.

## Files
- `index.html` — homepage
- `player.html` — public Player directory
- `agent.html` — public Agent directory
- `admin.html` — protected admin link manager
- `styles.css` — Cyber Neon Blue responsive design
- `app.js`, `admin.js` — website behavior
- `config.js` — Supabase project URL and public anon key
- `schema.sql` — database table, Row Level Security policies, and secure `community-images` Storage bucket

## 1. Set up Supabase
1. Create a project at https://supabase.com/.
2. In **Project Settings → API**, copy the Project URL and the **anon/public** key.
3. The supplied values are already filled into `config.js`. Confirm they match your Supabase project before deploying. Example format:
   ```js
   window.CJ_CONFIG = {
     SUPABASE_URL: "https://your-project-id.supabase.co",
     SUPABASE_ANON_KEY: "your-anon-public-key"
   };
   ```
   Use only the anon/public key in this browser website. **Never paste a `service_role` or secret key** into `config.js` or any public website file.
4. In Supabase **SQL Editor**, run all of `schema.sql`.
5. In **Authentication → Users**, create your admin user with an email and strong password. Turn off public sign-ups in Authentication settings if you only want manually created admin users.
6. For production, use Supabase Auth's allowed redirect URLs for your deployed site. The admin login sends the signed-in user to `admin.html`.

## 2. Deploy to Cloudflare Pages
1. Upload these files to a GitHub repository, or use Cloudflare Pages direct upload.
2. For a Git-connected Pages project, set the project root to the folder containing `index.html`. No build command is needed; this is a static site.
3. For direct upload, upload the **contents** of this folder (not the ZIP itself if the dashboard expects extracted files).
4. Visit the deployed URL and test Player, Agent, admin sign-in, and CRUD.

## 3. Fixing “Invalid API key”
- Confirm `SUPABASE_URL` is exactly the Project URL from the same Supabase project.
- Confirm `SUPABASE_ANON_KEY` is the matching **anon/public** key from that project, without extra spaces or quotes inside the value.
- Do not use the database password, JWT secret, or service role key.
- Ensure `schema.sql` has been run in the same project.
- Check browser developer tools/network if it still fails. Do not share passwords or secret keys in chat.

## Security notes
- Public visitors can only read rows where `enabled = true`.
- Signed-in Supabase users can manage links with these policies. Therefore, create accounts only for trusted admins and disable public registration.
- The supplied admin UUID is checked by the frontend and by the SQL policies in `schema.sql`. Only that Supabase Auth user should be able to manage links. Do not create or share other admin accounts unless you intentionally update the allowlist.
- Validate all URLs and only add websites you trust.
- This is a frontend-only static site; Supabase stores the links and handles authentication.

## Local testing
You can open `index.html` for a quick visual preview. Supabase features require a valid config and are best tested through a local static server or deployed HTTPS site.


## Uploading link icons
In Admin Panel, choose an image in “Link icon / logo” before saving a link. PNG, JPG, WEBP, GIF, and SVG files up to 10 MB are supported. The updated `schema.sql` must be run in Supabase before icon uploads will work. This version uses the `community-images` bucket. It keeps public read access for displayed icons and limits uploads/updates/deletes to the designated admin Auth UUID. The public site only displays the icon; only the designated admin can upload or manage stored icons.


## OTHERS / NONE categories
The Admin Panel now supports OTHERS and NONE. Run the migration section at the end of `schema.sql` in Supabase SQL Editor before saving links in either new category. Enabled OTHERS/NONE links are displayed in the Community Links section on the public homepage.
