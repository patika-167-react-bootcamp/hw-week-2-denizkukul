class State {
  constructor(value) {
    this.value = value;
    this.subscribers = [];
  }
  addSubscriber(component) {
    this.subscribers.push(component);
  }
  removeSubscriber(component) {
    this.subscribers = this.subscribers.filter(this.subscriber !== component);
  }
  setValue(newValue) {
    this.value = newValue;
    this.subscribers.forEach(component => component.render());
  }
}

class idGenerator {
  constructor() {
    this.value = 1;
  }
  getID() {
    let id = this.value
    this.value += 1;
    return id;
  }
}

// Parent class for all components
class Component {
  constructor(args) {
    // Get all arguments passed to constructor
    for (let arg in args) {
      this[arg] = args[arg];
    }
    this.targetElementID = `component-${idCounter.getID()}`
    this.childComponents = [];
    this.parentComponent && this.parentComponent.childComponents.push(this);

    this.subscribe();
    this.bindAll();
  }

  // Get all defined class methods and bind all to this object
  // This is needed for "this" inside event handler functions to refer to component object instead of the target element;
  bindAll() {
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
    methods.forEach((method) => {
      if (method !== 'constructor') {
        this[method] = this[method].bind(this);
      }
    })
  }

  // Method to get date and time
  getTime() {
    let today = new Date();
    let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    return date + ' ' + time;
  }

  // Add this component to subscribers of related states
  subscribe() {
    this.subscriptions && this.subscriptions.forEach(state => state.addSubscriber(this));
  }

  // Search parent component to get target element with id
  getTargetElement() {
    this.targetElement = document.querySelector(`#${this.targetElementID}`);
    // If component target no longer exists, remove it from state subscribers
    if (!this.targetElement) this.subscriptions.forEach(removeSubscriber(this));
  }

  // Trigger render of all child components
  renderChildComponents() {
    this.childComponents.forEach(component => component.render());
  }

  // Return target element for this component;
  target() {
    return (`
      <div id=${this.targetElementID} class="${this.constructor.name.toLowerCase()}-component"></div>
    `)
  }

  // Render this components template in target element
  render() {
    // If this is initial render get target element
    !this.targetElement && this.getTargetElement();
    // Set innerHTML of this components target element
    this.targetElement.innerHTML = this.template();
    // Trigger render of all child components
    this.childComponents && this.renderChildComponents();
    // If this component uses event listeners, add event listeners
    this.addListeners && this.addListeners();
  }
  // Components must be created as a new class extending Component class with template method
  // Event listeners must be added in addListeners method
}

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

// Component userlist-item
class UserListItem extends Component {

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

// Component returns select element with user options
class UserSelect extends Component {

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
const idCounter = new idGenerator();
const root = document.querySelector("#root");
const app = new App({ targetElement: root });
app.render();