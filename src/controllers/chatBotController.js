require("dotenv").config();
import request from "request";
import chatBotService from "../services/chatBotService";
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

let getHomepage = (req, res) => {
  return res.render("homepage.ejs");
};

let postWebhook = (req, res) => {
  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === "page") {
    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {
      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log("Sender PSID: " + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Return a '200 OK' response to all events
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
};
let getWebhook = (req, res) => {
  // Your verify token. Should be a random string.

  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
};

// Handles messages events
function handleMessage(sender_psid, received_message) {
  let response;

  // Checks if the message contains text
  if (received_message.text) {
    // Create the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    response = {
      text: `You sent the message: "${received_message.text}". Now send me an attachment!`,
    };
  } else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: "Is this the right picture?",
              subtitle: "Tap a button to answer.",
              image_url: attachment_url,
              buttons: [
                {
                  type: "postback",
                  title: "Yes!",
                  payload: "yes",
                },
                {
                  type: "postback",
                  title: "No!",
                  payload: "no",
                },
              ],
            },
          ],
        },
      },
    };
  }

  // Send the response message
  callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
async function handlePostback(sender_psid, received_postback) {
  let response;

  // Get the payload for the postback
  let payload = received_postback.payload;
  switch (payload) {
    case "yes":
      response = { text: "Thanks!" };
      break;

    case "no":
      response = { text: "Oops, try sending another image." };
      break;
    case "RESET_CHATBOT":
    case "GET_STARTED":
      await chatBotService.handleGetstarted(sender_psid);

      break;
    case "QUEST1":
      response = {
        text: "Trường Đại học Kinh tế – Kỹ thuật Công nghiệp có 4 địa điểm đào tạo, trong đó cơ sở Nam Định có 2 địa điểm tại 353 Trần Hưng Đạo, TP Nam Định và phường Mỹ Xá, TP Nam Định. Tại cơ sở Hà Nội có 2 địa điểm tại 454 Minh Khai, quận Hai Bà Trưng và 218 Lĩnh Nam, phường Lĩnh Nam, quận Hoàng Mai, TP Hà Nội.",
      };
      break;

    case "QUEST2":
      response = {
        text: `Trong những năm qua trường luôn tích cực đẩy mạnh phong trào thi đua rèn luyện học tập,đã đạt được một số thành tựu tiêu biểu như : 
      01 Huân chương Độc lập Hạng Nhất (2011) 
      01 Huân chương Độc lập Hạng Nhất (2005) 
      01 Huân chương Lao động hạng Ba cho Công đoàn (2005)`,
      };
      break;
    // Trong function handlePostback
    case "QUEST3":
      response = {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: `Trường gồm  24 Ngành học bao gồm những ngày nổi trội những năm gần đây với đa dạng tổ hợp xét tuyển như A00,A01,B00,C01,D01...`,
            buttons: [
              {
                type: "web_url",
                url: "https://uneti.edu.vn/thong-tin-co-ban-ve-tuyen-sinh-nam-2023-cua-truong-dai-hoc-kinh-te-ky-thuat-cong-nghiep/",
                title: "Xem Chuyên Ngành",
                webview_height_ratio: "full", // Thay đổi thành "compact" hoặc "tall" nếu bạn không muốn webview đầy đủ chiều cao
              },
            ],
          },
        },
      };
      break;
    // Cuối cùng đừng quên gửi phản hồi:
    // callSendAPI(sender_psid, response);
    case "QUEST4":
      response = {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: `Xem thêm chi tiết tại đây`,
            buttons: [
              {
                type: "web_url",
                url: "https://uneti.edu.vn/tb-hb-nb-2023/",
                title: "Xem Chuyên Ngành",
                webview_height_ratio: "full", // Thay đổi thành "compact" hoặc "tall" nếu bạn không muốn webview đầy đủ chiều cao
              },
            ],
          },
        },
      };
      break;
    default:
      response = { text: `Tôi không hiểu yêu cầu ${payload} của bạn !` };
      break;
  }

  // // Send the message to acknowledge the postback
  // callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid,
    },
    message: response,
  };

  // Send the HTTP request to the Messenger Platform
  request(
    {
      uri: "https://graph.facebook.com/v18.0/me/messages",
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: "POST",
      json: request_body,
    },
    (err, res, body) => {
      if (!err) {
        console.log("message sent!");
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
}
let getFacebookUserProfile = async (req, res) => {
  // Construct the message body
  let request_body = {
    get_started: { payload: "GET_STARTED" },
    whitelisted_domains: ["https://uneti-chatbot.onrender.com"],
  };

  // Send the HTTP request to the Messenger Platform
  await request(
    {
      uri: `https://graph.facebook.com/v18.0/me/messenger_profile?access_token=${PAGE_ACCESS_TOKEN}`,
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: "POST",
      json: request_body,
    },
    (err, res, body) => {
      console.log(body);
      if (!err) {
        console.log("Thiết lập profile thành công !");
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
  return res.send("Thiết lập profile thành công !");
};

// let setuppersistentmenu = async (req, res) => {
//   // Construct the message body
//   let request_body = {
//     persistent_menu: [
//       {
//         locale: "default",
//         composer_input_disabled: false,
//         call_to_actions: [
//           {
//             type: "web_url",
//             title: "Trang Chủ Trường",
//             url: "https://uneti.edu.vn/",
//             webview_height_ratio: "full",
//           },
//           {
//             type: "web_url",
//             title: "Kiểm Tra Thông Tin",
//             url: "https://sinhvien.uneti.edu.vn/tra-cuu-thong-tin.html/",
//             webview_height_ratio: "full",
//           },
//           {
//             type: "postback",
//             title:
//               "Trường đại học đại học kinh tế kỹ thuật công nghiệp UNETI có mấy cơ sở?",
//             payload: "QUEST1",
//           },
//           {
//             type: "postback",
//             title:
//               "Thành tựu mà Trường đại học đại học kinh tế kỹ thuật đạt đc trong các năm qua?",
//             payload: "QUEST2",
//           },
//           {
//             type: "postback",
//             title:
//               "Trường đại học đại học kinh tế kỹ thuật CN có bao nhiêu chuyên ngành học?",
//             payload: "QUEST3",
//           },
//           {
//             type: "postback",
//             title:
//               "Tôi có thể tìm hiểu và đăng ký đơn xét duyệt học bổng ở đâu?",
//             payload: "QUEST4",
//           },
//           {
//             type: "postback",
//             title: "Khởi động lại chat bot",
//             payload: "RESET_CHATBOT",
//           },
//         ],
//       },
//     ],
//   };

//   // Send the HTTP request to the Messenger Platform
//   await request(
//     {
//       uri: `https://graph.facebook.com/v18.0/me/messenger_profile?access_token=${PAGE_ACCESS_TOKEN}`,
//       qs: { access_token: PAGE_ACCESS_TOKEN },
//       method: "POST",
//       json: request_body,
//     },
//     (err, res, body) => {
//       console.log(body);
//       if (!err) {
//         console.log("Thiết lập persistion thành công !");
//       } else {
//         console.error("Unable to send message:" + err);
//       }
//     }
//   );
//   return res.send("Thiết lập persistion thành công !");
// };
module.exports = {
  getHomepage: getHomepage,
  getWebhook: getWebhook,
  postWebhook: postWebhook,
  getFacebookUserProfile: getFacebookUserProfile,
  // setuppersistentmenu: setuppersistentmenu,
};
