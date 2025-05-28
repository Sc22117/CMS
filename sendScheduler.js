//Import required tools
const admin = require("firebase-admin");
const Brevo = require("sib-api-v3-sdk");

const serviceAccount = require("./serviceAccountKey.json");
//backend script gets full access to Firestore
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
//Authenticate with Brevo
const brevoClient = Brevo.ApiClient.instance;
const apiKey = brevoClient.authentications['api-key'];
apiKey.apiKey = "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";

const emailApi = new Brevo.TransactionalEmailsApi();

async function sendScheduledMessages() {
  const now = new Date(); //Get the current time
  const snapshot = await db.collection("scheduledMessages")  //Search Firestore for unsent messages
    .where("sent", "==", false)
    .where("scheduledAt", "<=", now)
    .get();

  if (snapshot.empty) {
    console.log("⏳ No scheduled messages.");
    return;
  }

  for (const doc of snapshot.docs) { //Iterate through the messages to be sent
    const msg = doc.data();
    const docId = doc.id;

    const email = { //Create the email object
      sender: { name: "Shraddha Chauhan", email: "shraddhachauhan637@gmail.com" }, 
      to: [{ email: msg.to }],
      subject: msg.subject || "Scheduled Message",
      htmlContent: `<p>${msg.text}</p>`
    };

    try {
      await emailApi.sendTransacEmail(email);  //The email object passed to Brevo’s email sending function, which delivers the email
      console.log(`📤 Sent to ${msg.to}`);

      await db.collection("scheduledMessages").doc(docId).update({ sent: true });
      console.log(`✅ Marked as sent in Firestore`);
    } catch (err) {
      console.error(`❌ Failed to send to ${msg.to}`, err.response?.text || err);
    }
  }
}

sendScheduledMessages();
