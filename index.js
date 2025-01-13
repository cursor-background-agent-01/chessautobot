const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath:
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Path to Chrome
    userDataDir: "./bin", // To save browser session data
  });

  const page = await browser.newPage();
  await page.goto("https://www.chess.com/play/online", {
    waitUntil: "load",
    timeout: 90000,
  });

  //   function setPositionAndStartGame() {
  //     engine.postMessage(`position fen ${fen_string}`); // Set the position
  //     engine.postMessage("go depth 10"); // Start calculating the best move
  //   }
  //   sendUciCommands();
  //   //listen for when moves are made
  //   var getPlays = setInterval(() => {
  //     var new_fen_string = getFenString();
  //     new_fen_string += ` ${player_colour}`;
  //     if (new_fen_string !== fen_string) {
  //       console.log("new move detected");
  //       console.log(new_fen_string);
  //       fen_string = new_fen_string;
  //       engine.postMessage(`position fen ${fen_string}`); // Update position
  //       engine.postMessage(`go depth ${depth}`); // Request best move
  //     }
  //   }, 1000);
  //   engine.onmessage = function (event) {
  //     console.log(event.data);

  //     if (event.data === "readyok") {
  //       console.log("Stockfish is ready");
  //       sendUciCommands(); // Send UCI commands after engine is ready
  //     }
  //     if (event.data.startsWith("bestmove")) {
  //       const bestMove = event.data.split(" ")[1];
  //       // Use the best move in your application
  //       char_map = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 };
  //       console.log("Best move:", bestMove);
  //       document.getElementById(
  //         "best-move"
  //       ).innerHTML = ` Bestmove is ${bestMove}. Tap to stop`;
  //       //create cheat squares on the board
  //       previous_cheat_squares = document
  //         .querySelectorAll(".cheat-highlight")
  //         .forEach((element) => {
  //           //remove all previous cheat squares
  //           element.remove();
  //         });
  //       bestMove_array = bestMove.split("");
  //       initial_position = `${char_map[bestMove_array[0]]}${bestMove_array[1]}`;
  //       final_position = `${char_map[bestMove_array[2]]}${bestMove_array[3]}`;

  //       initial_highlight = document.createElement("div");
  //       initial_highlight.className = `highlight cheat-highlight square-${initial_position}`;
  //       initial_highlight.style =
  //         "background: rgba(0, 0, 0, 0.1);backdrop-filter: blur(0.4px);";

  //       final_highlight = document.createElement("div");
  //       final_highlight.className = `highlight cheat-highlight square-${final_position}`;
  //       final_highlight.style = "background: rgba(0, 0, 0, 0.2);";
  //       document.querySelector("wc-chess-board").appendChild(initial_highlight);
  //       document.querySelector("wc-chess-board").appendChild(final_highlight);
  //     }
  //   };

  // Expose a Puppeteer function
  console.log("Starting exposing function clickAsync!");
  var getFen = async () =>
    await page.evaluate(() => {
      var player_colour = document
        .querySelector(".board")
        .classList.contains("flipped")
        ? "b"
        : "w";
      let fen_string = "";
      for (var i = 8; i >= 1; i--) {
        for (var j = 1; j <= 8; j++) {
          let position = `${j}${i}`;
          if (j == 1 && i != 8) {
            fen_string += "/";
          }
          let piece_in_position =
            document.querySelector(`.piece.square-${position}`)?.classList ??
            null;
          if (piece_in_position != null) {
            piece_in_position = Array.from(piece_in_position).find(
              (cls) => cls.length === 2
            );
          }
          if (piece_in_position == null) {
            let previous_char = fen_string.split("").pop();
            if (!isNaN(Number(previous_char))) {
              fen_string = fen_string.substring(0, fen_string.length - 1);
              fen_string += Number(previous_char) + 1;
            } else {
              fen_string += "1";
            }
          } else if (piece_in_position?.startsWith("b")) {
            fen_string += piece_in_position[1];
          } else if (piece_in_position?.startsWith("w")) {
            fen_string += piece_in_position[1].toUpperCase();
          }
        }
      }

      fen_string += ` ${player_colour}`;

      // Validate castling rights
      const whiteKing = document.querySelector(".piece.wk.square-51"); // Example position for white king
      const blackKing = document.querySelector(".piece.bk.square-58"); // Example position for black king
      const whiteRookKingside = document.querySelector(".piece.wr.square-81"); // Example position for white kingside rook
      const whiteRookQueenside = document.querySelector(".piece.wr.square-11"); // Example position for white queenside rook
      const blackRookKingside = document.querySelector(".piece.br.square-88"); // Example position for black kingside rook
      const blackRookQueenside = document.querySelector(".piece.br.square-18"); // Example position for black queenside rook

      let castling = "";
      if (whiteKing && whiteRookKingside) castling += "K";
      if (whiteKing && whiteRookQueenside) castling += "Q";
      if (blackKing && blackRookKingside) castling += "k";
      if (blackKing && blackRookQueenside) castling += "q";
      if (!castling) castling = "-";

      fen_string += ` ${castling}`;

      // Append en passant target square
      const enPassantTarget = "-"; // Replace with actual calculation
      fen_string += ` ${enPassantTarget}`;

      // Append halfmove clock and fullmove number
      const halfmoveClock = 0; // Replace with actual count
      const fullmoveNumber = 1; // Replace with actual calculation
      fen_string += ` ${halfmoveClock} ${fullmoveNumber}`;

      return fen_string;
    });
  var isGlobalBlack = false;
  var canMove = false;

  await page.exposeFunction("newMove", async (isBlack) => {
    console.log("New move " + isBlack);
    if (isGlobalBlack == isBlack) return;
    canMove = true;
    console.log("Got new move from " + isBlack ? "black" : "white");
    var new_fen_string = await getFen();
    if (new_fen_string !== last_fen_string) {
      console.log("Old fen " + last_fen_string + " New fen " + new_fen_string);
      last_fen_string = new_fen_string;
      await page.evaluate((fen) => {
        window.engine.postMessage(`position fen ${fen}`); // Set the position
        window.engine.postMessage("go depth 10"); // Start calculating the best move
      }, last_fen_string);
    }
  });

  await page.exposeFunction("onMessage", async (message) => {
    console.log(message);
    if (canMove && message.startsWith("bestmove")) {
      var dic = {
        a: 1,
        b: 2,
        c: 3,
        d: 4,
        e: 5,
        f: 6,
        g: 7,
        h: 8,
      };
      var bestMove = message.split(" ")[1];
      var fromLetter = bestMove[0];
      var fromNumber = bestMove[1];
      var toLetter = bestMove[2];
      var toNumber = bestMove[3];
      var squareFrom = `square-${dic[fromLetter]}${fromNumber}`;
      var squareTo = `square-${dic[toLetter]}${toNumber}`;
      console.log(`Moving from ${squareFrom} to ${squareTo}`);
      //   const selector = ".wp.square-42"; // Replace with your actual selector
      await page.click("." + squareFrom, {
        delay: 100,
      });
      try {
        await page.click(".hint." + squareTo, {
          delay: 100,
        }); // Perform click in Puppeteer's context
      } catch {
        try {
          await page.click(".capture-hint." + squareTo, {
            delay: 100,
          }); // Perform click in Puppeteer's context
        } catch {
          await page.click("." + squareFrom, {
            delay: 100,
          });
        }
      }
      canMove = false;
      var last_fen_string = await getFen();

      const isThereAChange = await new Promise((resolve) => {
        const checkChange = async () => {
          console.log("Checking for change");
          const fen = await getFen();
          if (fen !== last_fen_string) {
            resolve(true);
          } else {
            setTimeout(checkChange, 300); // Recheck after 1 second
          }
        };
        checkChange(); // Start the first check
      });

      if (isThereAChange) {
        page.evaluate((isBlack) => {
          window.newMove(isBlack);
        }, !isGlobalBlack);
        canMove = true;
      } else {
        await page.evaluate(() => {
          if (window.chessObserver) {
            window.chessObserver.disconnect();
          }
          function checkElement(element) {
            if (!element.classList.contains("piece")) return false;

            // Check if any class in the classList has length 2 and starts with 'w'
            for (const cls of element.classList) {
              if (
                cls.length === 2 &&
                (cls.startsWith("w") || cls.startsWith("b"))
              ) {
                return true;
              }
            }
            return false;
          }
          function isBlack(element) {
            for (const cls of element.classList) {
              if (cls.length === 2 && cls.startsWith("b")) {
                return true;
              }
            }
            return false;
          }

          // Callback function for MutationObserver
          function observeClassChanges(mutationsList) {
            for (const mutation of mutationsList) {
              console.log(mutation);
              if (
                mutation.type === "attributes" &&
                mutation.attributeName === "class"
              ) {
                const element = mutation.target; // Move this line up here
                console.log("Element changed: ", element); // This will now log the correct element
                window.newMove(isBlack(element));
                break;
              }
            }
          }

          console.log("Starting chess observer");
          window.chessObserver = {};
          console.log(window.chessObserver);
          window.chessObserver = new MutationObserver(observeClassChanges);

          document.querySelectorAll(".piece").forEach((element) => {
            if (!checkElement(element)) return;
            console.log("Observing this element: ", element.className); // Log className for debugging
            window.chessObserver.observe(element, {
              attributes: true, // Observe attribute changes
              attributeFilter: ["class"], // Only listen to changes in the class attribute
            });
          });
        });
      }
    }
  });
  var last_fen_string = "";
  await page.exposeFunction("stopAsync", async () => {
    isGlobalBlack = false;
    last_fen_string = undefined;
    await page.evaluate(() => {
      if (window.engine) window.engine.terminate();
      window.engine = undefined;
    });
  });
  await page.exposeFunction("clickAsync", async () => {
    try {
      isGlobalBlack = false;
      await page.evaluate(() => {
        if (window.engine) window.engine.terminate();
        window.engine = undefined;
      });
      console.log("Starting stockfish");
      await page.evaluate(() => {
        window.engine = new Worker(
          "/bundles/app/js/vendor/jschessengine/stockfish.asm.1abfa10c.js"
        );
        window.engine.onmessage = (event) => {
          window.onMessage(event.data);
        };
      });
      console.log("Starting UCI Commands");
      async function sendUciCommands() {
        await page.evaluate(() => {
          window.engine.postMessage("uci"); // Send UCI command
          // window.engine.postMessage('setoption name Threads value 1'); // Use 40 threads
          // window.engine.postMessage('setoption name Hash value 256'); // Allocate 256 MB for hashing
          window.engine.postMessage("setoption name Skill Level value 20"); // Maximize strength
          window.engine.postMessage("ucinewgame"); // Prepare for a new game
          window.engine.postMessage("isready"); // Check readiness
        });
      }
      await sendUciCommands();
      var isBlack = await page.evaluate(() =>
        document.querySelector(".board").classList.contains("flipped")
      );
      isGlobalBlack = isBlack;
      var fen = await getFen();
      last_fen_string = fen;
      await page.evaluate((fen) => {
        window.engine.postMessage(`position fen ${fen}`); // Set the position
        window.engine.postMessage("go depth 10"); // Start calculating the best move
      }, fen);
      canMove = true;
      //const engine = new Worker(jsHelperUrl)

      //   var dic = {
      //     a: 1,
      //     b: 2,
      //     c: 3,
      //     d: 4,
      //     e: 5,
      //     f: 6,
      //     g: 7,
      //     h: 8,
      //   };
      //   var resp = await fetch(
      //     `https://www.stockfish.online/api/s/v2.php?fen=${encodeURIComponent(
      //       fen
      //     )}&depth=15`,
      //     {
      //       headers: {
      //         accept: "*/*",
      //         "accept-language": "ar,en-US;q=0.9,en;q=0.8",
      //         priority: "u=1, i",
      //         "sec-ch-ua":
      //           '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      //         "sec-ch-ua-mobile": "?0",
      //         "sec-ch-ua-platform": '"Windows"',
      //         "sec-fetch-dest": "empty",
      //         "sec-fetch-mode": "cors",
      //         "sec-fetch-site": "same-origin",
      //         Referer: "https://www.stockfish.online/",
      //         "Referrer-Policy": "strict-origin-when-cross-origin",
      //       },
      //       body: null,
      //       method: "GET",
      //     }
      //   );
      //   var jsonResp = await resp.json();
      //   var bestMove = jsonResp.bestmove.split(" ")[1];
      //   var fromLetter = bestMove[0];
      //   var fromNumber = bestMove[1];
      //   var toLetter = bestMove[2];
      //   var toNumber = bestMove[3];
      //   var squareFrom = `square-${dic[fromLetter]}${fromNumber}`;
      //   var squareTo = `square-${dic[toLetter]}${toNumber}`;
      //   console.log(`Moving from ${squareFrom} to ${squareTo}`);
      //   //   const selector = ".wp.square-42"; // Replace with your actual selector
      //   await page.click("." + squareFrom, {
      //     delay: 100,
      //   });
      //   try {
      //     await page.click(".hint." + squareTo, {
      //       delay: 100,
      //     }); // Perform click in Puppeteer's context
      //   } catch {
      //     await page.click(".capture-hint." + squareTo, {
      //       delay: 100,
      //     }); // Perform click in Puppeteer's context
      //   }
      //   //   const hintSelector = ".hint.square-43"; // Replace with your actual selector
      //   //   console.log(`Clicked on selector: ${selector}`);
    } catch (error) {
      console.error("Failed to click on the selector:", error);
    }
  });
  console.log("Done exposing function clickAsync!");

  // Inject a script into the page to listen for key presses
  await page.evaluateOnNewDocument(() => {
    window.addEventListener("keydown", (event) => {
      if (event.altKey && event.key === "w") {
        console.log("Alt+W pressed");
        window.clickAsync(); // Call the exposed Puppeteer function
      }
    });
  });

  console.log("Key bindings added. Interact with the page and press Alt+W!");

  // Keep the browser open for user interaction
})();
