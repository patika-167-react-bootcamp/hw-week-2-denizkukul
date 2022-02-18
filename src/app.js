// Main component renders body element
class App extends Component {
  constructor(args) {
    const users = new State([]);
    const carts = new State({});
    const history = new State([]);
    const products = new State([]);
    const currentUser = new State(null);

    // Calling parent constructor this way calls initial render after childComponents and states are set
    // This only creates the states, if this component needs to subscribe, they should also be added to argummets as subscriptions array
    // super({...args, users, history, subscriptions:[...args.subscriptions,users,history]})
    super({ ...args, users, history, products, currentUser, carts });
  }
  template() {
    return (`
      <div id="${this.targetElementID}" class="app">
        ${new UsersPanel({ users: this.users, history: this.history, parentComponent: this }).target()}
        ${new TransfersPanel({ users: this.users, history: this.history, parentComponent: this }).target()}
        ${new ProductsPanel({ currentUser: this.currentUser, carts: this.carts, products: this.products, parentComponent: this }).target()}
        ${new TransactionPanel({ currentUser: this.currentUser, carts: this.carts, products: this.products, users: this.users, parentComponent: this }).target()}
      </div>
    `)
  }
}