require("dotenv").config();
import { resolveInclude } from "ejs";
import { response } from "express";
import request from "request";
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const IMAGE_GET_STARTED = "https://t.ly/nG7iq";
let getUserName = (sender_psid) => {
  // Construct the message body
  return new Promise((resolve, reject) => {
    request(
      {
        uri: `https://graph.facebook.com/${sender_psid}?fields=first_name,last_name,profile_pic&access_token=${PAGE_ACCESS_TOKEN}`,
        // qs: { access_token: PAGE_ACCESS_TOKEN },
        method: "GET",
      },
      (err, res, body) => {
        // console.log(body);
        if (!err) {
          body = JSON.parse(body);
          let username = `${body.last_name} ${body.first_name}`;
          resolve(username);
        } else {
          console.error("Unable to send message:" + err);
          reject(err);
        }
      }
    );
  });
  // Send the HTTP request to the Messenger Platform
};

let callSendAPI = (sender_psid, response) => {
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
      uri: "https://graph.facebook.com/v9.0/me/messages",
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
};
let handleGetstarted = (sender_psid) => {
  return new Promise(async (resolve, reject) => {
    try {
      let username = await getUserName(sender_psid);
      let response1 = {
        text: `Chào mừng ${username} đến với Chat Bot UNETI! Bạn đang cần tìm kiếm thông tin gì?`,
      };
      let response2 = sendGetstartedTemplate();

      //send text message

      await callSendAPI(sender_psid, response1);

      //send generic message template
      await callSendAPI(sender_psid, response2);

      resolve("done");
    } catch (error) {
      reject(error);
    }
  });
};

let sendGetstartedTemplate = () => {
  let response = {
    attachment: {
      type: "template",
      payload: {
        template_type: "generic",
        elements: [
          {
            title: "Chào mừng bạn đến với Chat Bot UNETI !",
            subtitle: "Bạn đang tìm kiếm thông tin gì?",
            image_url: IMAGE_GET_STARTED,
            buttons: [
              {
                type: "postback",
                title: "MENU CHÍNH",
                payload: "MAIN_MENU",
              },
              {
                type: "postback",
                title: "CÂU HỎI THƯỜNG GẶP",
                payload: "QUESTION_INFO",
              },

              {
                type: "postback",
                title: "HƯỚNG DẪN SỬ DỤNG",
                payload: "GUILD_TO_USE",
              },
            ],
          },
        ],
      },
    },
  };
  return response;
};

module.exports = {
  handleGetstarted: handleGetstarted,
};
