// Main component renders body element
class App extends Component {
  constructor(args) {
    const users = new State([]);
    const history = new State([]);
    // Calling parent constructor this way calls initial render after childComponents and states are set
    // This only creates the states, if this component needs to subscribe, they should also be added to argummets as subscriptions array
    // super({...args, users, history, subscriptions:[...args.subscriptions,users,history]})
    super({ ...args, users, history });
  }
  template() {
    return (`
    <div id="${this.targetElementID}" class="app">
      <div class="users-panel">
        ${new NewUser({ users: this.users, history: this.history, parentComponent: this }).target()}
        ${new UserList({ users: this.users, subscriptions: [this.users], parentComponent: this }).target()}
      </div>
      <div class="transfers-panel">
        ${new NewTransfer({ users: this.users, history: this.history, subscriptions: [this.users], parentComponent: this }).target()}
        ${new HistoryLogs({ history: this.history, subscriptions: [this.history], parentComponent: this }).target()}
      </div>
    </div>
    `)
  }
}

// Component adds new users to the list
class NewUser extends Component {
  generateUserID() {
    // Random number 100000 - 999999
    return Math.floor(Math.random() * (900000) + 100000);
  }
  addUser(e) {
    e.preventDefault();
    // Get input elements
    const usernameInput = this.targetElement.querySelector(".username-input");
    const balanceInput = this.targetElement.querySelector(".balance-input");
    // Add new user to users state
    let uid = this.generateUserID()
    this.users.setValue([...this.users.value, { name: usernameInput.value, uid: uid, balance: Number(balanceInput.value) }])
    this.history.setValue([...this.history.value, { type: "adduser", time: this.getTime(), username: usernameInput.value, uid: uid, balance: balanceInput.value }])
    // Clear input fields
    usernameInput.value = "";
    balanceInput.value = "";
  }
  template() {
    return (`
      <div class="title"> Add new user </div>
      <form class="adduser-form">
        <div class="inputs-container">
          <input class="username-input" placeholder="Name" required pattern="([a-zA-Z]+[a-zA-Z ]+)" maxlength="20"/>
          <input class="balance-input" type="number" placeholder="Balance" required min="0" max="999999999"/>
        </div>
        <div class="button-container">
          <button class="adduser-button"> Add </button>
        </div>
      </form>
    `);
  }
  addListeners() {
    this.targetElement.querySelector(".adduser-form").addEventListener("submit", this.addUser);
  }
}

// Component lists usersnames and balances
class UserList extends Component {
  template() {
    return (`
        <div class="title"><p class=username>User</p><p class="balance">Balance</p></div>
        <ul class="userlist">
        ${this.users.value.map(user => `<li><p class=username>${user.name}</p><p class="balance">${user.balance} ₺</p></li>`).join("")}
        </ul>
    `)
  }
}



// Component manages transfers --- subscribes to users state
class NewTransfer extends Component {
  transfer(e) {
    e.preventDefault();
    // Get input nodes
    let sendFromUID = Number(this.targetElement.querySelector(".sendfrom-input").value);
    let sendToUID = Number(this.targetElement.querySelector(".sendto-input").value);
    let sendAmount = Number(this.targetElement.querySelector(".amount-input").value);
    let sendToName;
    let sendFromName;

    if (sendFromUID === sendToUID) {
      this.history.setValue([...this.history.value, { type: "error", time: this.getTime(), message: "Sender and reciever can not be same user." }])
      return;
    }

    // Transfer money
    const newUsersState = this.users.value.map(user => {
      if (user.uid === sendFromUID) {
        sendFromName = user.name;
        return { ...user, balance: (user.balance - sendAmount) };
      }
      if (user.uid === sendToUID) {
        sendToName = user.name;
        return { ...user, balance: (user.balance + sendAmount) };
      }
      else {
        return { ...user };
      }
    })
    this.users.setValue(newUsersState);
    this.history.setValue([...this.history.value, { type: "transfer", time: this.getTime(), sendAmount, sendFromName, sendFromUID, sendToName, sendToUID }])
  }

  template() {
    return (`
      <div class="title"> Money transfer </div>
      <form class="newtransfer-form">
        <div class="column">
          <select class="sendfrom-input" required>
            <option value="" disabled selected>From</option>
            ${this.users.value.map(user => `<option value="${user.uid}">${user.name}</option>`).join("")}
          </select>
          <select class="sendto-input" required>
            <option value="" disabled selected>To</option>
            ${this.users.value.map(user => `<option value="${user.uid}">${user.name}</option>`).join("")}
          </select>
        </div >
        <div class="column">
          <input class="amount-input" type="number" placeholder="Amount" required max="999999999" />
          <button class="send-button"> Send </button>
        </div>
      </form >
  `)
  }

  addListeners() {
    this.targetElement.querySelector(".newtransfer-form").addEventListener("submit", this.transfer);
  }
}

// Component lists logs of transfers
class HistoryLogs extends Component {
  template() {
    return (`
    <div class="title"> History </div>
      <ul class="logs">
        ${this.history.value.map((log) => `<li>${new Log({ log, parentComponent: this }).target()}</li>`).join("")}
      </ul>
    `)
  }
}

class Log extends Component {
  template() {
    return (`
      <p class="time"> ${this.log.time}</p >
      ${this.log.type === "transfer" ?
        `<p class="message"><span class="val">${this.log.sendAmount}₺</span> has been transfered from <span class="val">${this.log.sendFromName} (id:${this.log.sendFromUID})</span> to <span class="val">${this.log.sendToName} (id:${this.log.sendToUID})</span></p>` : ""
      }
      ${this.log.type === "adduser" ?
        `<p class="message">New user <span class="val">${this.log.username} (id:${this.log.uid}) </span> has been added with <span class="val">${this.log.balance}₺ </span>balance.</p>` : ""
      }
      ${this.log.type === "error" ?
        `<p class="message">${this.log.message}</p>` : ""
      }
    `)
  }
}


// Initialize App
const idCount = new idCounter();
const root = document.querySelector("#root");
const app = new App({ targetElement: root });
app.render();