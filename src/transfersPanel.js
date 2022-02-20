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
    let senderID = Number(this.targetElement.querySelector(".sendfrom-input").value);
    let receiverID = Number(this.targetElement.querySelector(".sendto-input").value);
    let amount = Number(this.targetElement.querySelector(".amount-input").value);
    let receiverName;
    let senderName;

    if (senderID === receiverID) {
      this.history.setValue([...this.history.value, { id: this.generateID(), type: "error", time: this.getTime(), message: "Sender and reciever can not be same user." }])
      return;
    }

    // Transfer money
    const newUsersState = this.users.value.map(user => {
      if (user.id === senderID) {
        senderName = user.name;
        return { ...user, balance: (user.balance - amount) };
      }
      if (user.id === receiverID) {
        receiverName = user.name;
        return { ...user, balance: (user.balance + amount) };
      }
      else {
        return { ...user };
      }
    })
    this.users.setValue(newUsersState);
    this.history.setValue([...this.history.value, { id: this.generateID(), type: "transfer", time: this.getTime(), amount, senderName, senderID, receiverName, receiverID, reverted: false }])
  }

  template() {
    return (`
      <div class="title"> Transfer funds </div>
      <form class="newtransfer-form">
        <div class="column">
          <select class="sendfrom-input" required>
            <option value="" disabled selected>From</option>
            ${this.users.value.map(user => `<option value="${user.id}">${user.name}</option>`).join("")}
          </select>
          <select class="sendto-input" required>
            <option value="" disabled selected>To</option>
            ${this.users.value.map(user => `<option value="${user.id}">${user.name}</option>`).join("")}
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
    const filterType = new State("");
    const filterName = new State("");
    super({ ...args, filterType, filterName });
  }
  template() {
    return (`
      ${new HistoryLogsHead({ filterType: this.filterType, filterName: this.filterName, parentComponent: this }).target()}
      ${new HistoryLogsList({ history: this.history, filterType: this.filterType, filterName: this.filterName, users: this.users, subscriptions: [this.history, this.filterType, this.filterName], parentComponent: this }).target()}
    `)
  }
}

class HistoryLogsHead extends Component {
  setFilterType(e) {
    this.filterType.setValue(e.target.value);
  }
  setFilterName(e) {
    this.filterName.setValue(e.target.value);
  }
  clearFilters() {
    this.filterType.setValue("");
    this.filterName.setValue("");
    this.targetElement.querySelector(".filtertype-input").value = "";
    this.targetElement.querySelector(".filtername-input").value = "";
  }
  template() {
    return (`
      <div class="title"> History </div>
      <div class="filters">
        <select class="filtertype-input">
          <option value="" selected disabled hidden>Filter By</option>
          <option value="sender">Sender</option>
          <option value="receiver">Receiver</option>
          <option value="buyer">Buyer</option>
          <option value="any">Any</option>
        </select>
        <input class="filtername-input" placeholder="Name" pattern="([a-zA-Z]+[a-zA-Z ]+)" maxlength="20"/>
        <button class="clearfilters-button">Clear Filters</button>
      </div>
    `)
  }
  addListeners() {
    this.targetElement.querySelector(".filtertype-input").addEventListener("change", this.setFilterType);
    this.targetElement.querySelector(".filtername-input").addEventListener("input", this.setFilterName);
    this.targetElement.querySelector(".clearfilters-button").addEventListener("click", this.clearFilters);
  }
}

class HistoryLogsList extends Component {
  filterLogs() {
    let filterType = this.filterType.value;
    let filterName = this.filterName.value.toLowerCase();

    if (filterType === "" || filterName === "") return this.history.value;

    let logTypes;
    let filterFunction;
    switch (filterType) {
      case "sender":
        logTypes = ["transfer", "undotransfer"];
        filterFunction = (log) => { return (log.senderName.toLowerCase().includes(filterName)) }
        break;
      case "receiver":
        logTypes = ["transfer", "undotransfer"];
        filterFunction = (log) => { return (log.receiverName.toLowerCase().includes(filterName)) }
        break;
      case "buyer":
        logTypes = ["transaction", "undotransaction"];
        filterFunction = (log) => { return (log.buyerName.toLowerCase().includes(filterName)) }
        break;
      case "any":
        logTypes = null;
        filterFunction = (log) => {
          return (
            (log.senderName && log.senderName.toLowerCase().includes(filterName)) ||
            (log.receiverName && log.receiverName.toLowerCase().includes(filterName)) ||
            (log.buyerName && log.buyerName.toLowerCase().includes(filterName)))
        }
      default: logTypes = null;
    }

    return this.history.value.filter(log => (!logTypes || logTypes.some(type => type === log.type)) && (filterFunction(log)));
  }
  template() {
    return (`
      <ul class="logs">
        ${this.filterLogs().map((log) => `<li>${new Log({ history: this.history, users: this.users, log, parentComponent: this }).target()}</li>`).join("")}
      </ul>
    `)
  }
  afterRender() {
    // Scroll to bottom of the list
    let height = this.targetElement.scrollHeight;
    this.targetElement.scrollTop = height;
  }
}

class Log extends Component {
  undoTransfer() {
    if (this.log.reverted) return;
    let { senderID, receiverID, amount, receiverName, senderName } = this.log

    // Revert transfer
    let targetUsers = { senderID: false, receiverID: false };
    let newUsersState = this.users.value.map(user => {
      if (user.id === receiverID) {
        targetUsers.receiverID = true;
        return { ...user, balance: (user.balance - amount) };
      }
      if (user.id === senderID) {
        targetUsers.senderID = true;
        return { ...user, balance: (user.balance + amount) };
      }
      else {
        return { ...user };
      }
    })

    // Update this logs reverted state
    let log;
    if (targetUsers.senderID && targetUsers.receiverID) {
      this.users.setValue(newUsersState);
      log = { id: this.generateID(), type: "undotransfer", time: this.getTime(), senderID, receiverID, amount, receiverName, senderName };
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
        `<p class="message"><span class="val">${this.log.amount}₺</span> has been transfered from <span class="val">${this.log.senderName} (id:${this.log.senderID})</span> to <span class="val">${this.log.receiverName} (id:${this.log.receiverID})</span></p>
        <button class="undo-button ${!this.log.reverted ? "active" : ""}"><svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 0 24 24" width="26px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg></button>` : ""
      }
      ${this.log.type === "adduser" ?
        `<p class="message">New user <span class="val">${this.log.username} (id:${this.log.id}) </span> has been added with <span class="val">${this.log.balance}₺ </span>balance.</p>` : ""
      }
      ${this.log.type === "removeuser" ?
        `<p class="message">User <span class="val">${this.log.username} (id:${this.log.id}) </span> has been removed.</p>` : ""
      }
      ${this.log.type === "error" ?
        `<p class="message">${this.log.message}</p>` : ""
      }
      ${this.log.type === "undotransfer" ?
        `<p class="message">Transfer of <span class="val">${this.log.amount}₺</span> from <span class="val">${this.log.senderName} (id:${this.log.senderID})</span> to <span class="val">${this.log.receiverName} (id:${this.log.receiverID})</span> has been reverted.</p>` : ""
      }
    `)
  }
  addListeners() {
    if (this.log.type === "transfer" && !this.log.reverted) this.targetElement.querySelector(".undo-button").addEventListener("click", this.undoTransfer);
  }
}