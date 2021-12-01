import { createServer, Server, RequestListener } from "http";
import {} from "dependent-ts";

const test = "hello";
console.log({ test });

const listener: RequestListener = (req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.write("Hello World!");
  res.end();
};

function listen(...args: Parameters<Server["listen"]>) {
  const server = createServer(listener);

  server.on("close", function () {
    console.log(" Stopping ...");
  });

  process.on("SIGINT", function () {
    server.close();
  });

  return server.listen(...args);
}

const stuff = listen(8001);
