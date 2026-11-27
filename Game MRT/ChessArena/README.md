
# ♟️ ChessArena – Real-Time Multiplayer Chess Game

### Play • Compete • Think • Strategize

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Chess.js](https://img.shields.io/badge/Chess.js-36964F?style=for-the-badge)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)
![Multiplayer](https://img.shields.io/badge/Mode-Multiplayer-success?style=for-the-badge)

---

## 📖 Project Overview

ChessArena is an interactive browser-based chess application developed using JavaScript, Node.js, Express.js, Socket.IO, and Chess.js.

The project combines traditional chess gameplay with real-time client-server communication, allowing players to practice chess or compete against another player through room-based multiplayer matches.

It demonstrates practical applications of event-driven programming, server-side game logic, REST API development, interactive frontend design, and multiplayer game-state synchronization.

The primary objective is to create an engaging chess experience while exploring modern web technologies and real-time software engineering concepts.

---

## 🎯 Project Objectives

- Develop an interactive browser-based chess application.
- Implement real-time multiplayer communication.
- Explore server-authoritative game architecture.
- Build a room-based multiplayer system.
- Understand chess rules and game-state management.
- Implement synchronized chess clocks.
- Develop responsive and interactive web interfaces.
- Apply REST API and Socket.IO technologies.
- Strengthen JavaScript and backend development skills.

---

## ✨ Key Features

### ♟️ Chess Gameplay

- Interactive 8×8 chessboard.
- Standard chess piece movements.
- Legal move validation using Chess.js.
- Selected square highlighting.
- Possible move indicators.
- Automatic turn management.
- Check and checkmate detection.
- Draw detection.
- Pawn promotion.
- Castling and en passant through Chess.js.
- Server-provided move history.
- Game status updates.

### 🎮 Game Modes

#### Local Practice Mode

Practice chess by controlling both White and Black pieces.

The local practice game uses REST API communication with the backend server.

#### Online Multiplayer Mode

Compete against another player through a shared multiplayer room.

- Create a multiplayer room.
- Generate a unique six-character room code.
- Copy and share the room code.
- Join an existing room.
- Automatic White and Black player assignment.
- Independent chess state for each multiplayer room.
- Real-time synchronization between players.
- Opponent disconnection notification.

### ⏱️ Chess Clock System

- Five-minute and ten-minute time controls.
- Independent timers for both players.
- Server-side time calculation.
- Automatic clock switching after valid moves.
- Live timer synchronization.
- Timeout-based match results.
- Automatic clock termination when a match ends.

### 🏆 Match Result System

The multiplayer game supports several match-ending conditions:

- Checkmate
- Draw
- Timeout
- Player resignation
- Draw by mutual agreement

### 🤝 Draw Offer System

- Send a draw offer to the opponent.
- Accept or decline incoming draw offers.
- Prevent duplicate pending offers.
- Cancel pending offers following a completed move.
- End the match when a draw is accepted.

### 🎨 User Interface

- Modern dark-themed interface.
- Responsive chessboard layout.
- Unicode chess piece rendering.
- Interactive piece selection.
- Visual legal-move indicators.
- White and Black player clocks.
- Multiplayer room management panel.
- Room code copy functionality.
- Connection status indicators.
- Automatic board rotation for the Black player.
- Dynamic game status messages.
- Mobile-friendly layout.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| JavaScript | Game logic and application programming |
| HTML5 | Web interface structure |
| CSS3 | Styling and responsive layout |
| Node.js | Server-side application runtime |
| Express.js | HTTP server and REST API |
| Socket.IO | Real-time multiplayer communication |
| Chess.js | Chess rules and game-state management |
| Node.js Crypto | Random room code generation |
| Fetch API | REST API communication |
| DOM API | Dynamic board and interface rendering |
| npm | Package management |
| Git | Version control |
| GitHub | Source code hosting |

---

## 📦 Project Dependencies

| Package | Version Range |
|---|---|
| chess.js | ^1.4.0 |
| express | ^5.3.0 |
| socket.io | ^4.8.4 |

The project uses the CommonJS module system.

---

## 🏗️ System Architecture

ChessArena follows a client-server architecture.

The frontend handles user interaction and visual presentation, while the backend maintains chess game states, validates moves, manages multiplayer rooms, and synchronizes game events.

### Architecture Diagram

    +--------------------------------+
    |       Browser / Frontend       |
    |     HTML, CSS, JavaScript      |
    +---------------+----------------+
                    |
          REST API / Socket.IO
                    |
                    v
    +--------------------------------+
    |       Node.js HTTP Server      |
    |          Express.js            |
    +---------------+----------------+
                    |
                    v
    +--------------------------------+
    |        Game Management         |
    |                                |
    |  Local Practice                |
    |  Multiplayer Rooms             |
    |  Player Management             |
    |  Chess Clocks                  |
    |  Match Results                 |
    +---------------+----------------+
                    |
                    v
    +--------------------------------+
    |            Chess.js            |
    |       Chess Rule Engine        |
    +--------------------------------+

The server acts as the authoritative source of multiplayer game state.

---

## 📂 Project Structure

    ChessArena/
    |
    |-- public/
    |   |
    |   |-- css/
    |   |   |-- style.css
    |   |
    |   |-- js/
    |   |   |-- app.js
    |   |   |-- socket-client.js
    |   |
    |   |-- index.html
    |
    |-- server.js
    |-- package.json
    |-- README.md

The structure above highlights the main application files.

### File Responsibilities

| File | Responsibility |
|---|---|
| server.js | HTTP server, REST API, rooms, clocks and chess logic |
| index.html | Main game interface |
| style.css | Visual design and responsive layouts |
| app.js | Board rendering, game interaction and frontend game state |
| socket-client.js | Multiplayer rooms, socket events and synchronization |
| package.json | Dependencies and application scripts |
| README.md | Project documentation |

---

## ♟️ Chess Rule Engine

ChessArena uses the Chess.js library to manage chess rules.

The backend is responsible for validating moves and maintaining the official game state.

### Chess Concepts

| Concept | Purpose |
|---|---|
| FEN | Representing the current board position |
| SAN | Standard algebraic notation for moves |
| Legal Moves | Identifying valid destination squares |
| Turn Management | Determining the active player |
| Check | Detecting an attacked king |
| Checkmate | Determining a decisive chess result |
| Draw | Detecting drawn positions |
| Promotion | Replacing a pawn on the final rank |

Online promotion supports Queen, Rook, Bishop, and Knight.

The local practice move API defaults to Queen promotion.

---

## 🔄 Multiplayer Workflow

    Player One Creates Room
              |
              v
      Room Code Generated
              |
              v
      Player Two Joins Room
              |
              v
       Assign Player Colors
              |
              v
       Start Chess Clock
              |
              v
       Exchange Game Moves
              |
              v
       Validate on Server
              |
              v
      Synchronize Game State
              |
              v
       Determine Match Result

The room creator plays White, while the joining player plays Black.

The match clock begins when both players are connected.

---

## 📡 REST API Documentation

REST API endpoints are used for server health monitoring and local practice gameplay.

Base URL:

http://localhost:3000

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/health | Check server availability |
| GET | /api/game | Retrieve local game state |
| GET | /api/game/legal-moves/:square | Retrieve legal moves |
| POST | /api/game/move | Submit a local chess move |
| POST | /api/game/reset | Reset the practice game |

### Example Move Request

Endpoint:

    POST /api/game/move

Request body:

    {
      "from": "e2",
      "to": "e4"
    }

Content-Type:

    application/json

The server validates the requested move and returns the updated game state.

---

## ⚡ Socket.IO Event Documentation

Socket.IO enables bidirectional communication between the server and connected players.

### Client-to-Server Events

| Event | Purpose |
|---|---|
| room:create | Create a multiplayer room |
| room:join | Join an existing room |
| game:state | Request current match state |
| game:legal-moves | Request valid chess moves |
| game:move | Submit a multiplayer move |
| game:offer-draw | Send a draw offer |
| game:respond-draw | Accept or decline a draw |
| game:resign | Resign from a match |

### Server-to-Client Events

| Event | Purpose |
|---|---|
| room:state | Publish multiplayer room information |
| room:game | Broadcast updated match state |
| room:clock | Synchronize chess timers |
| game:draw-offered | Notify the opponent of a draw offer |
| game:draw-resolved | Publish the draw offer outcome |
| room:closed | Notify the remaining player that the room has closed |

Socket acknowledgements are used to communicate successful operations and errors.

---

## 🔐 Game Validation and Reliability

The application includes server-side checks for:

- Valid chess square coordinates.
- Legal piece movements.
- Correct player turns.
- Multiplayer room membership.
- Maximum room capacity of two players.
- Supported match time controls.
- Valid promotion choices.
- Invalid or duplicate draw responses.
- Operations attempted after a match ends.

These checks help maintain consistent gameplay between connected clients.

The room system is intended for casual multiplayer sessions rather than authenticated competitive play.

---

## ⚙️ Installation and Setup

### Prerequisites

- Node.js
- npm
- Git
- A modern web browser
- Visual Studio Code or another code editor

### Step 1: Clone the Repository

    git clone https://github.com/Masudur797/Advanced-Web-Technology.git

### Step 2: Navigate to ChessArena

    cd "Advanced-Web-Technology/Game MRT/ChessArena"

### Step 3: Install Dependencies

    npm install

### Step 4: Start the Application

    npm start

Alternatively:

    node server.js

### Step 5: Open the Application

Visit the following address in your browser:

[http://localhost:3000](http://localhost:3000)

### Server Configuration

The server uses port 3000 by default.

A different port can be configured using the PORT environment variable.

---

## 🎮 How to Play

### Local Practice

1. Start the application.
2. Open ChessArena in a browser.
3. Select a chess piece.
4. Choose a highlighted legal destination.
5. Alternate between White and Black.
6. Continue until the game ends.

### Multiplayer Match

1. Open ChessArena.
2. Click Create Room.
3. Select an available match duration.
4. Copy the generated room code.
5. Share the code with another player.
6. The second player enters the room code.
7. Click Join Room.
8. Start playing the chess match.
9. Continue until the game ends.

### Testing Multiplayer Locally

Open the application in two separate browser tabs or windows.

Create a room in the first window and join it from the second window using the generated room code.

Both clients should connect to the same running server.

To play across different devices, the server must be reachable from both devices.

---

## 🖼️ Screenshots and Demonstrations

Actual application screenshots can be added here to demonstrate:

- Main ChessArena interface.
- Interactive chessboard.
- Multiplayer room creation.
- Online chess match.
- Live chess clock.
- Draw offer and resignation system.
- Match result screen.
- Mobile layout.

---

## 🧠 Software Engineering Concepts

| Concept | Implementation |
|---|---|
| Client-Server Architecture | Frontend and backend communication |
| Event-Driven Programming | Socket.IO and browser events |
| Asynchronous Programming | API requests and socket responses |
| State Management | Board, player and room states |
| RESTful API | Local game operations |
| Real-Time Communication | Multiplayer event synchronization |
| DOM Manipulation | Dynamic chessboard generation |
| Input Validation | Move and room validation |
| Error Handling | API and socket error responses |
| Timer Management | Server-side chess clocks |
| Data Structures | In-memory room management |
| Responsive Design | Adaptive browser interface |
| Version Control | Git and GitHub workflows |

---

## 🧪 Testing

Suggested manual testing scenarios:

- Valid and invalid chess moves.
- Room creation and joining.
- Invalid room codes.
- Joining a full room.
- Attempting to move out of turn.
- Synchronization between two players.
- Clock switching after a move.
- Match timeout.
- Checkmate and draw detection.
- Draw acceptance and rejection.
- Player resignation.
- Opponent disconnection.

The current package.json contains a placeholder test script. An automated test suite is a future improvement.

---

## 📌 Current Limitations

- Multiplayer rooms are stored in server memory.
- Rooms are removed when a participating player disconnects.
- Game data does not persist after a server restart.
- The local practice game is shared at server level.
- No persistent user accounts or ranking system.
- No dedicated chess AI opponent.
- No production deployment is documented.

---

## 🚀 Future Improvements

- Stockfish chess engine integration.
- Single-player mode against AI.
- Multiple AI difficulty levels.
- User registration and authentication.
- Player profiles and statistics.
- ELO rating system.
- Global leaderboard.
- Automatic opponent matchmaking.
- Public and private lobby system.
- In-game chat.
- Match replay and analysis.
- PGN import and export.
- Opening analysis.
- Chess puzzles and training mode.
- Tournament management.
- Spectator mode.
- Database integration.
- Persistent match history.
- Multiplayer reconnection support.
- Additional chess time controls.
- Sound effects and move animations.
- Automated testing.
- Cloud deployment and CI/CD.

---

## 📚 Learning Outcomes

Through this project, I aim to develop practical experience in:

- Full-stack JavaScript development.
- Real-time web application development.
- Multiplayer game architecture.
- Backend programming with Node.js.
- REST API development with Express.js.
- Socket.IO communication.
- Interactive frontend design.
- Server-side game validation.
- State synchronization.
- Asynchronous programming.
- Application debugging.
- Software engineering and problem-solving.

---

## 🎓 Academic Purpose

ChessArena was developed as a practical web development project to explore multiplayer application architecture, interactive game development, real-time communication, and modern JavaScript technologies.

It represents my interest in combining programming, logical thinking, and software engineering to build interactive digital experiences.

---

## 🤝 Contributions and Feedback

Constructive feedback, suggestions, and recommendations are always welcome.

Feel free to explore the source code and share ideas for improving ChessArena.

---

## 👨‍💻 Developer

### Masudur Rahman

Interested in software engineering, web development, backend technologies, real-time applications, and interactive game development.

[![GitHub](https://img.shields.io/badge/GitHub-Masudur797-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Masudur797)

---

## ⭐ Support

If you find this project interesting, consider giving the repository a star.

Your support encourages continuous learning and development.

---

<p align="center">
  <b>♟️ Every Move Matters ♟️</b>
</p>

<p align="center">
  Think Ahead. Play Smart. Challenge Yourself.
</p>

<p align="center">
  ChessArena – Where Strategy Meets Technology.
</p>

<p align="center">
  Built with JavaScript, Node.js, Express.js and Socket.IO.
</p>

<p align="center">
  Thank you for visiting this project!
</p>
