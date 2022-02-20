// Users-Panel
class UsersPanel extends Component {
  template() {
    return (`
    ${new NewUser({ users: this.users, history: this.history, parentComponent: this }).target()}
    ${new UserList({ users: this.users, history: this.history, subscriptions: [this.users], parentComponent: this }).target()}
    `)
  }
}

// Component adds new users to the list
class NewUser extends Component {
  addUser(e) {
    e.preventDefault();
    // Get input elements
    const usernameInput = this.targetElement.querySelector(".username-input");
    const balanceInput = this.targetElement.querySelector(".balance-input");
    // Add new user to users state
    let id = this.generateID()
    this.users.setValue([...this.users.value, { name: usernameInput.value, id: id, balance: Number(balanceInput.value) }])
    this.history.setValue([...this.history.value, { id: this.generateID(), type: "adduser", time: this.getTime(), username: usernameInput.value, id: id, balance: balanceInput.value }])
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
        ${this.users.value.map(user => `<li>${new UserListItem({ user, history: this.history, users: this.users, parentComponent: this }).target()}</li>`).join("")}
        </ul>
    `)
  }
}

// Component userlist-item
class UserListItem extends Component {
  removeUser() {
    this.users.setValue(this.users.value.filter(user => user.id !== this.user.id));
    this.history.setValue([...this.history.value, { id: this.generateID(), type: "removeuser", time: this.getTime(), id: this.user.id, username: this.user.name }])
  }
  template() {
    return (`
      <p class=username>${this.user.name}</p>
      <p class="balance">${this.user.balance} ₺</p>
      <button class="removeuser-button"><svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 0 24 24" width="26px" fill="#4b7bec"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M14.59 8L12 10.59 9.41 8 8 9.41 10.59 12 8 14.59 9.41 16 12 13.41 14.59 16 16 14.59 13.41 12 16 9.41 14.59 8zM12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg></button>
    `)
  }
  addListeners() {
    this.targetElement.querySelector(".removeuser-button").addEventListener("click", this.removeUser);
  }
}