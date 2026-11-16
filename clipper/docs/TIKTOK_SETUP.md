# TikTok connection: copy-paste guide (about 15 minutes, once)

You do this once. After it's done, every account (EN, ES, more later) connects with one click each.

## 1. Create the developer app
1. Go to https://developers.tiktok.com and log in with your main TikTok account. Any of your accounts works. The app isn't tied to the clip accounts.
2. Click **Manage apps → Connect an app** (or **Create app**). Pick **Individual** if it asks for a type.
3. Fill in these fields:
   | Field | Paste this |
   |---|---|
   | App name | `Clip Studio` (or anything) |
   | Category | `Entertainment` |
   | Description | `Personal tool that uploads my own edited gaming clips to my TikTok accounts.` |
   | Platform | `Web` |
   | Terms of Service URL | `https://superdayroom.com` (any page you own) |
   | Privacy Policy URL | `https://superdayroom.com` |
   | Website URL | `https://superdayroom.com` |
4. **Add products:** click **Add products**, then add **Login Kit** and **Content Posting API**.
5. **Login Kit → Redirect URI:** `https://superdayroom.com/callback`. The page doesn't need to exist. You'll copy the address from the browser bar after it fails to load.
6. **Content Posting API:** turn on **Upload** (drafts). You can request **Direct Post** later, when you submit the app for review.
7. **Scopes:** tick `user.info.basic`, `video.upload`, `video.publish`, `video.list`.
8. Click **Save**. Leave it as a draft. You don't need to submit it for review to start: unreviewed apps can upload to drafts for your own accounts. In the **Sandbox** section, add your EN and ES TikTok accounts as **target users**.
9. Copy the **Client key** and **Client secret** from the app page.

## 2. Put the keys in the clipper
Create the file `clipper/secrets/tiktok_app.json` with this content:
```json
{"client_key": "PASTE_CLIENT_KEY", "client_secret": "PASTE_CLIENT_SECRET", "redirect_uri": "https://superdayroom.com/callback"}
```

## 3. Connect each account
In the browser, log into the **English clips** TikTok, then run:
```
python -m clipper auth tiktok --account en
```
1. It prints a link. Open it, then click **Authorize**.
2. The browser goes to `superdayroom.com/callback?code=...`. The page may show an error; that's fine.
3. Copy that whole address from the address bar and paste it into the terminal.

Next, switch the browser to the **Spanish clips** TikTok and run `python -m clipper auth tiktok --account es`. Follow the same steps.

## 4. Later: post without tapping
Unreviewed apps upload to **drafts**: you open the TikTok app, add a sound and tap post. To post fully automatically, submit the app for review under **App review** and request Direct Post. It takes a few days to a few weeks. Explain that it's a personal tool posting your own edited clips. Once approved, set `publish.tiktok.mode: direct` and `privacy_level: PUBLIC_TO_EVERYONE` in `config/settings.yaml`.
