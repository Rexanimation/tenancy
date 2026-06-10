# 📧 Email Configuration Troubleshooting & Fix Guide

यह गाइड आपको यह समझाने के लिए है कि आपका ईमेल कॉन्फ़िगरेशन क्यों काम करना बंद कर देता है और आप इसे हमेशा के लिए कैसे ठीक कर सकते हैं।

---

## 🔍 समस्या का कारण (Why did this happen?)

जांच करने पर पता चला कि बैकएंड से ईमेल भेजते समय निम्नलिखित एरर आ रही थी:
`GaxiosError: invalid_grant - Token has been expired or revoked.`

इसका मतलब है कि Google APIs के लिए इस्तेमाल होने वाला **OAuth2 Refresh Token** एक्सपायर (समाप्त) या निरस्त (revoke) हो गया है। इसके मुख्य कारण निम्नलिखित हैं:

1. **OAuth Consent Screen "Testing" मोड में होना (सबसे मुख्य कारण):**
   अगर आपका Google Cloud Project का OAuth Consent Screen **"Testing"** मोड में कॉन्फ़िगर है, तो Google के नियमों के अनुसार सभी Refresh Tokens **7 दिनों के बाद ऑटोमैटिकली एक्सपायर** हो जाते हैं। इसलिए 7 दिन बाद ईमेल काम करना बंद कर देता है।
2. **Google Account का पासवर्ड बदलना:**
   यदि आपने हाल ही में अपने Gmail अकाउंट (`rajawatsahil256@gmail.com` या `nickleister402@gmail.com`) का पासवर्ड बदला है, तो सुरक्षा कारणों से Google पुराने सभी active refresh tokens को ब्लॉक/रद्द कर देता है।
3. **App Permission हटाना:**
   अगर आपने Google Account Settings (Third-party apps with account access) से इस ऐप की परमिशन हटा दी थी।
4. **Client Credentials का बदलना:**
   यदि Google Cloud Console में Client ID या Client Secret को री-जनरेट या डिलीट किया गया हो।

---

## 🛠️ समाधान: इसे कैसे ठीक करें (Step-by-Step Fix)

इसे पूरी तरह ठीक करने के लिए आपको 2 काम करने होंगे:
1. **Google Cloud App को "Production" मोड में डालना (ताकि टोकन 7 दिनों में एक्सपायर न हो)।**
2. **नया Refresh Token जनरेट करना और `.env` फ़ाइल को अपडेट करना।**

---

### Step 1: Google Cloud App को "Production" मोड में बदलें 🚀
यह स्टेप बहुत महत्वपूर्ण है ताकि भविष्य में टोकन बार-बार एक्सपायर न हो।

1. [Google Cloud Console](https://console.cloud.google.com/) पर जाएं।
2. अपने Project को सेलेक्ट करें (जिसमें आपने OAuth Client ID बनाई थी)।
3. लेफ्ट मेन्यू में **APIs & Services** > **OAuth consent screen** पर जाएं।
4. **Publishing status** के नीचे देखें। अगर वहां **Testing** लिखा है, तो उसके नीचे दिए गए **"Publish App"** बटन पर क्लिक करें।
5. पॉप-अप में **Confirm** पर क्लिक करें।
   > [!NOTE]
   > अब आपका ऐप "In Production" मोड में आ जाएगा। इससे आपके Refresh Tokens कभी भी 7 दिन में एक्सपायर नहीं होंगे। (Verification की कोई आवश्यकता नहीं है, बस Publish करना काफी है)।

---

### Step 2: नया Refresh Token जनरेट करें 🔑
टोकन री-जनरेट करने के लिए Google OAuth Playground का उपयोग करें:

1. [Google OAuth Playground](https://developers.google.com/oauthplayground/) ओपन करें।
2. **Settings (Gear Icon ⚙️):**
   - स्क्रीन के ऊपर दाएं कोने (Top-Right) में गियर आइकन पर क्लिक करें।
   - **"Use your own OAuth credentials"** चेकबॉक्स को टिक करें।
   - अपने प्रोजेक्ट का `OAuth Client ID` और `OAuth Client Secret` डालें (ये आपके बैकएंड की स्थानीय `.env` फ़ाइल में `GOOGLE_CLIENT_ID` और `GOOGLE_CLIENT_SECRET` के रूप में मौजूद हैं):
     - **Client ID:** `आपकी_Local_.env_फ़ाइल_से_GOOGLE_CLIENT_ID_कॉपी_करें`
     - **Client Secret:** `आपकी_Local_.env_फ़ाइल_से_GOOGLE_CLIENT_SECRET_कॉपी_करें`
   - **Close** पर क्लिक करें।

3. **Step 1: Select & Authorize APIs:**
   - बाईं ओर दिए गए इनपुट बॉक्स (Input authorization scope) में डायरेक्ट यह स्कोप पेस्ट करें:
     `https://mail.google.com/`
   - **Authorize APIs** बटन पर क्लिक करें।
   - अपना Gmail अकाउंट सेलेक्ट करें (जैसे `rajawatsahil256@gmail.com`) और **Allow/Continue** करें।

4. **Step 2: Exchange authorization code for tokens:**
   - आपको वापस Playground पेज पर रिडायरेक्ट कर दिया जाएगा।
   - **"Exchange authorization code for tokens"** बटन पर क्लिक करें।
   - नीचे आपको **Refresh token** और **Access token** दिखाई देंगे।
   - वहां से **Refresh token** को कॉपी कर लें।

*(यदि Nick के ईमेल `nickleister402@gmail.com` का भी टोकन एक्सपायर है, तो यही प्रक्रिया उसके ईमेल के साथ दोबारा करें और उसका टोकन भी निकाल लें).*

---

### Step 3: `.env` फ़ाइल को अपडेट करें 📝

1. अपने बैकएंड प्रोजेक्ट की `.env` फ़ाइल (`backend/.env`) को ओपन करें।
2. नीचे दिए गए वेरिएबल्स में नए टोकन को पेस्ट करें:

```env
# ============================================================
# EMAIL CONFIGURATION - GOOGLE OAUTH2 (GMAIL API)
# ============================================================

ADMIN_SAHIL_EMAIL=rajawatsahil256@gmail.com
ADMIN_SAHIL_REFRESH_TOKEN=यहाँ_नया_साहिल_का_रिफ्रेश_टोकन_पेस्ट_करें

ADMIN_NICK_EMAIL=nickleister402@gmail.com
ADMIN_NICK_REFRESH_TOKEN=यहाँ_नया_निक_का_रिफ्रेश_टोकन_पेस्ट_करें
```

3. फ़ाइल को सेव (Ctrl + S) करें।
4. बैकएंड सर्वर को रीस्टार्ट करें:
   ```bash
   cd backend
   npm run dev
   ```

---

### Step 4: ईमेल की जांच करें (Verification) 🧪

सर्वर चालू होने के बाद, आप टेस्ट ईमेल भेजकर जांच सकते हैं कि ईमेल काम कर रहा है या नहीं:

**ब्राउज़र में यह URL ओपन करें:**
`http://localhost:5000/test-email?to=your_personal_email@gmail.com`

**या cURL कमांड चलाएं:**
```bash
curl "http://localhost:5000/test-email?to=your_personal_email@gmail.com"
```

अगर सब सही है, तो आपको रिस्पॉन्स मिलेगा:
```json
{
  "success": true,
  "message": "Test email sent!"
}
```
और आपके इनबॉक्स में **"Test Email from Tenancy Tracker ✅"** नाम से एक ईमेल प्राप्त होगा।

---

## 💡 Pro-Tip (भविष्य के लिए सुझाव)
* ऐप को **Production Mode** में रखने पर टोकन एक्सपायर नहीं होगा जब तक कि आप अपना पासवर्ड न बदलें या Google Account से परमिशन न हटाएं।
* अगर भविष्य में कभी भी ईमेल बंद होता है, तो सबसे पहले `backend/testEmail.mjs` जैसा छोटा स्क्रिप्ट चलाकर या सीधे `/test-email` एंडपॉइंट को कॉल करके एरर कोड चेक करें।
