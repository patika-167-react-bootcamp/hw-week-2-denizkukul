// Transfers-Panel
class TransfersPanel extends Component {
  template() {
    return (`
      ${new NewTransfer({ users: this.users, history: this.history, subscriptions: [this.users], parentComponent: this }).target()}
      ${new HistoryLogs({ users: this.users, history: this.history, parentComponent: this }).target()}
    `)
  }
}

// Component manages transfers
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
      this.history.setValue([...this.history.value, { id: this.generateID(), type: "error", time: this.getTime(), message: "Sender and reciever can not be same user." }])
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
    this.history.setValue([...this.history.value, { id: this.generateID(), type: "transfer", time: this.getTime(), sendAmount, sendFromName, sendFromUID, sendToName, sendToUID, reverted: false }])
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
  constructor(args) {
    const fromFilter = new State("");
    const toFilter = new State("");
    super({ ...args, fromFilter, toFilter });
  }
  template() {
    return (`
      ${new HistoryLogsHead({ history: this.history, fromFilter: this.fromFilter, toFilter: this.toFilter, parentComponent: this }).target()}
      ${new HistoryLogsList({ history: this.history, fromFilter: this.fromFilter, toFilter: this.toFilter, users: this.users, subscriptions: [this.history, this.toFilter, this.fromFilter], parentComponent: this }).target()}
    `)
  }
}

class HistoryLogsHead extends Component {
  setFromFilter(e) {
    this.fromFilter.setValue(e.target.value);
  }
  setToFilter(e) {
    this.toFilter.setValue(e.target.value);
  }
  template() {
    return (`
      <div class="title"> History </div>
      <div class="filters">
        <div class="label"> Filter By: </div>
        <input class="fromfilter-input" placeholder="From" pattern="([a-zA-Z]+[a-zA-Z ]+)" maxlength="20"/>
        <input class="tofilter-input" placeholder="To" pattern="([a-zA-Z]+[a-zA-Z ]+)" maxlength="20"/>
      </div>
    `)
  }
  addListeners() {
    this.targetElement.querySelector(".fromfilter-input").addEventListener("input", this.setFromFilter);
    this.targetElement.querySelector(".tofilter-input").addEventListener("input", this.setToFilter);
  }
}

class HistoryLogsList extends Component {
  filterLogs() {
    if (this.fromFilter.value === "" && this.toFilter.value === "") return this.history.value;
    return this.history.value.filter(log => (log.sendFromName && log.sendFromName.includes(this.fromFilter.value)) && (log.sendToName && log.sendToName.includes(this.toFilter.value)))
  }
  template() {
    return (`
      <ul class="logs">
        ${this.filterLogs().map((log) => `<li>${new Log({ history: this.history, users: this.users, log, parentComponent: this }).target()}</li>`).join("")}
      </ul>
    `)
  }
  afterRender() {
    let height = this.targetElement.scrollHeight;
    this.targetElement.scrollTop = height;
  }
}

class Log extends Component {
  undoTransfer() {
    if (this.log.reverted) return;
    let { sendFromUID, sendToUID, sendAmount, sendToName, sendFromName } = this.log

    // Revert transfer
    let targetUsers = { sendFromUID: false, sendToUID: false };
    let newUsersState = this.users.value.map(user => {
      if (user.uid === sendToUID) {
        targetUsers.sendToUID = true;
        return { ...user, balance: (user.balance - sendAmount) };
      }
      if (user.uid === sendFromUID) {
        targetUsers.sendFromUID = true;
        return { ...user, balance: (user.balance + sendAmount) };
      }
      else {
        return { ...user };
      }
    })

    // Update this logs reverted state
    let log;
    if (targetUsers.sendFromUID && targetUsers.sendToUID) {
      this.users.setValue(newUsersState);
      log = { id: this.generateID(), type: "undotransfer", time: this.getTime(), sendFromUID, sendToUID, sendAmount, sendToName, sendFromName };
    }
    else {
      log = { id: this.generateID(), type: "error", time: this.getTime(), message: "Can not revert transfer, user does not exists!" };
    }

    let newHistoryState = this.history.value.map(log => {
      if (log.id === this.log.id) {
        return { ...log, reverted: true }
      }
      else {
        return { ...log }
      }
    })

    this.history.setValue([...newHistoryState, log])
  }
  template() {
    return (`
    <p class="time"> ${this.log.time}</p >
    ${this.log.type === "transfer" ?
        `<p class="message"><span class="val">${this.log.sendAmount}₺</span> has been transfered from <span class="val">${this.log.sendFromName} (id:${this.log.sendFromUID})</span> to <span class="val">${this.log.sendToName} (id:${this.log.sendToUID})</span></p>
        <button class="undo-button ${!this.log.reverted ? "active" : ""}"><svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 0 24 24" width="26px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg></button>` : ""
      }
      ${this.log.type === "adduser" ?
        `<p class="message">New user <span class="val">${this.log.username} (id:${this.log.uid}) </span> has been added with <span class="val">${this.log.balance}₺ </span>balance.</p>` : ""
      }
      ${this.log.type === "removeuser" ?
        `<p class="message">User <span class="val">${this.log.username} (id:${this.log.uid}) </span> has been removed.</p>` : ""
      }
      ${this.log.type === "error" ?
        `<p class="message">${this.log.message}</p>` : ""
      }
      ${this.log.type === "undotransfer" ?
        `<p class="message">Transfer of <span class="val">${this.log.sendAmount}₺</span> from <span class="val">${this.log.sendFromName} (id:${this.log.sendFromUID})</span> to <span class="val">${this.log.sendToName} (id:${this.log.sendToUID})</span> has been reverted.</p>` : ""
      }
    `)
  }
  addListeners() {
    if (this.log.type === "transfer" && !this.log.reverted) this.targetElement.querySelector(".undo-button").addEventListener("click", this.undoTransfer);
  }
}