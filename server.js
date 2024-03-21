const http = require("http");
const { v4: uuidv4 } = require("uuid");
const errHandle = require("./errorHandle");
const todos = [];

const server = http.createServer((req, res) => {
  const headers = {
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Content-Length, X-Requested-With",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PATCH, POST, GET,OPTIONS,DELETE",
    "Content-Type": "application/json",
  };
  // 請求過程中，傳送的資料(data) 將會切分成 各個 TCP 封包(chunk => Buffer)傳輸，到伺服器後(end)結合變成資料
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  if (req.url === "/todos" && req.method == "GET") {
    // GET : todo
    res.writeHead(200, headers);
    res.write(
      JSON.stringify({
        status: "success",
        data: todos,
      })
    );
    res.end();
  } else if (req.url === "/todos" && req.method == "POST") {
    // POST : todo
    req.on("end", () => {
      // 避免傳送資料格式不正確導致錯誤
      try {
        console.log(body);
        let title = JSON.parse(body).title;
        if (title !== undefined) {
          const todo = {
            title: title,
            id: uuidv4(),
          };
          todos.push(todo);
          res.writeHead(200, headers);
          res.write(
            JSON.stringify({
              status: "success",
              data: todos,
            })
          );
          res.end();
        } else {
          errHandle(res);
        }
      } catch (error) {
        errHandle(res);
      }
    });
  } else if (req.url == "/todos" && req.method == "DELETE") {
    // 刪除所有 todo
    todos.length = 0;
    // todos = []; 不懂為甚麼這個清空陣列指令不行，因為這樣是賦予一個新陣列而不是單純清空當前陣列嗎] ?
    res.writeHead(200, headers);
    res.write(
      JSON.stringify({
        status: "success",
        data: todos,
      })
    );
    res.end();
  } else if (req.url.startsWith("/todos/") && req.method == "DELETE") {
    // 刪除特定的 todo
    let id = req.url.split("/").pop();
    let index = todos.findIndex((todo) => todo.id === id); // 找不到匯回傳 -1
    if (index !== -1) {
      todos.splice(index, 1);
      res.writeHead(200, headers);
      res.write(
        JSON.stringify({
          status: "success",
          data: todos,
        })
      );
      res.end();
    } else {
      errHandle(res);
    }
  } else if (req.url.startsWith("/todos/") && req.method == "PATCH") {
    // 修改特定的 todo 部分資料 (因為要抓 body 資料所以要監聽)
    req.on("end", () => {
      try {
        const title = JSON.parse(body).title;
        const id = req.url.split("/").pop();
        let index = todos.findIndex((todo) => todo.id === id);
        if (title !== undefined && index !== -1) {
          todos[index].title = title;
          res.writeHead(200, headers);
          res.write(
            JSON.stringify({
              status: "success",
              data: todos,
            })
          );
          res.end();
        } else {
          errHandle(res);
        }
      } catch (error) {
        errHandle(res);
      }
    });
  } else if (req.method == "OPTIONS") {
    // 因為 preflight api 檢查機制，所以需特別設定
    // preflight 主要針對請求不同網域的 api，會先以 OPTIONS 請求進行檢查，許可同意後才會 執行原本的方法進行請求
    res.writeHead(200, headers);
    res.end();
  } else {
    res.writeHead(404, {
      "Content-Type": "text/plain",
    });
    res.write(
      JSON.stringify({
        status: "false",
        message: "404 not found page!!!",
      })
    );
    res.end();
  }
});
let port = process.env.PORT || 3008;
let hostname = "localhost";
server.listen(port, hostname, () => {
  console.log(`the server is listening on http://${hostname}:${port}`);
});
