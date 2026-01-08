importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCY2qB4sbPs_7BIz355cQiQkDDqK-S_z4I",
  projectId: "flux-chat-b9cb2",
  messagingSenderId: "887456585588",
  appId: "1:887456585588:web:7a0689fb9feacc9dcebe21"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/logo192.png"
    }
  );
});
