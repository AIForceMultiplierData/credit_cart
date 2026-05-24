const fs = require("fs");
const path = "C:/Users/hkathuria/Downloads/poolpay/components/ping-drawer.tsx";
let text = fs.readFileSync(path, "utf8");
text = text.replace(/<\/?motionlessdiv/g, (match) =>
  match.replace("motionlessdiv", "div")
);
fs.writeFileSync(path, text);
