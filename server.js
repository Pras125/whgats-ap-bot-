const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = "myverify123";

// ⚠️ Replace with fresh permanent token + correct Phone Number ID
const ACCESS_TOKEN = "EAAk1w5FjLXUBPVtsLWVP9Q6JojSekPokS1gzjk8xPtaDgBB0k129le46CiyksdC73XpXMHzvfmLM1Gd3Sua74ZCuHt1KZCR5XgW2M9p4BZCyn4ZCxAFWG1A8wj5CF21lbfKT7NIcOUdRm4ZAlfmfbguYDzSRRSI5qo5j5V87yaMeqJzb3nZBVmZBvDROSVB0JXeZAD0hbQZCERY0pnjCzfi5CsqejNznpGe0barUBvviGZCJnJwgZDZD"; 
const WHATSAPP_NUMBER_ID = "743654928835870"; 

const jsonStructure = {
  pu018: {
    defaultMessage1: "pu018",
    defaultMessage2: "You are at Basement pu018.",
    block1: {
      message: "Hy Pitron, thank you for visiting Virtu Malls. Currently you are at PU018?",
      query1: {
        "Know_Your_Spot": "You are at P1 Upper Deck. Locate: https://b0x.app/i/zAw7W6Tg?tag=wa&m=s"
      },
      query2: {
        "Locate": "You are at P1 Basement. Locate your car: https://b0x.app/i/Z0mLdERg?tag=wa&m=e"
      }
    }
  },
  g047: {
    defaultMessage1: "g047",
    defaultMessage2: "You are at Basement g047. Click [here](https://b0x.app/i/zAw7W6Tg?tag=wa&m=s) for navigation.",
    block1: {
      message: "Would you like to explore more options?",
      query1: {
        "Know_Your_Spot": "You are at P1 Upper Deck. Locate: https://b0x.app/i/zAw7W6Tg?tag=wa&m=s"
      },
      query2: {
        "Locate": "You are at P1 Basement. Locate your car: https://b0x.app/i/Z0mLdERg?tag=wa&m=e"
      }
    }
  }
};

const replies = {
  "hi": "Welcome to Virtubox! How can I help you today?",
  "how to use": "To use our services, visit https://www.virtubox.io 📲",
  "services": "Our services include:\n1. Digital Signage\n2. Interactive Kiosks\n3. Digital Library\n4. Smart Education Platforms",
  "contact": "Reach us at info@virtubox.io or call +91-XXXXXXXXXX ☎️",
  "support": "Get support at https://support.virtubox.io or email support@virtubox.io",
  "thank you": "You're welcome! 😊 Let us know if you need anything else."
};

let currentContextKey = "p1";

// 🔹 Webhook Verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log("✅ Webhook Verified");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 🔹 Message Handler
app.post('/webhook', async (req, res) => {
  const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  const from = message?.from;

  let userMsg = message?.text?.body?.toLowerCase().trim() ||
                message?.interactive?.button_reply?.id?.toLowerCase().trim();

  if (!message || !from || !userMsg) return res.sendStatus(404);

  console.log("📩 Message received:", userMsg);

  const context = jsonStructure[currentContextKey];

  try {
    switch (userMsg) {
      case "pingbot":
        await sendTextMessage(from, "Pong!");
        break;

      case "hi":
        await sendInteractiveMessage(from, "Welcome to Virtubox! Choose an option below:", [
          { type: "reply", reply: { id: "know_spot_1", title: "Know Your Spot" } },
          { type: "reply", reply: { id: "know_spot_2", title: "Locate" } }
        ]);
        break;

      case "know_spot_1":
        await sendTextMessage(from, context.block1.query1["Know_Your_Spot"]);
        break;

      case "know_spot_2":
        await sendTextMessage(from, context.block1.query2["Locate"]);
        break;

      default:
        if (replies[userMsg]) {
          await sendTextMessage(from, replies[userMsg]);
        } else if (jsonStructure[userMsg]) {
          currentContextKey = userMsg; 
          const selectedContext = jsonStructure[userMsg];
          await sendTextMessage(from, selectedContext.defaultMessage2);
          await sendInteractiveMessage(from, selectedContext.block1.message, [
            { type: "reply", reply: { id: "know_spot_1", title: "Know Your Spot" } },
            { type: "reply", reply: { id: "know_spot_2", title: "Locate" } }
          ]);
        } else {
          await sendTextMessage(from, "❓ Sorry, I didn’t understand that. Try saying 'hi' or 'p1'.");
        }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Handler Error:", err.response?.data || err.message);
    await sendTextMessage(from, "⚠️ Something went wrong. Please try again later.");
    res.sendStatus(500);
  }
});

// 🔹 Helpers
async function sendTextMessage(to, message) {
  await axios.post(
    `https://graph.facebook.com/v20.0/${WHATSAPP_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      text: { body: message }
    },
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
}

async function sendInteractiveMessage(to, bodyText, buttons) {
  await axios.post(
    `https://graph.facebook.com/v20.0/${WHATSAPP_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: { buttons }
      }
    },
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
