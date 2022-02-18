// Transaction-Panel
class TransactionPanel extends Component {
  template() {
    return (`
    ${new ManageTransaction({ users: this.users, carts: this.carts, currentUser: this.currentUser, products: this.products, subscriptions: [this.users], parentComponent: this }).target()}
    ${new CartList({ currentUser: this.currentUser, carts: this.carts, products: this.products, subscriptions: [this.currentUser, this.carts], parentComponent: this }).target()}
    `)
  }
}

// Component selects user cart and sells items inside
class ManageTransaction extends Component {
  confirmTransaction(e) {
    e.preventDefault();
    let cart = this.carts.value[this.currentUser.id];
    let totalCost = 0;
    let newProductsValue = this.products.value.map(product => {
      let inCart = cart.find(item => item.product.id === product.id);
      if (inCart) {
        totalCost += inCart.amount * inCart.product.price;
        return { ...product, stock: product.stock - inCart.amount }
      }
      else return product;
    })

    let newUsersValue = this.users.value.map(user => {
      if (user.uid === this.currentUser.uid) {
        return { ...user, balance: user.balance - totalCost };
      }
      else {
        return user;
      }
    })


    this.products.setValue(newProductsValue);
    this.carts.setValue({ ...this.carts, [this.currentUser.id]: [] });
    this.users.setValue(newUsersValue);
  }
  setCurrentUser(e) {
    // Takes user objects reference;
    this.currentUser.setValue(this.users.value.filter(user => user.uid === Number(e.target.value))[0]);
  }
  template() {
    return (`
      <div class="title"> Manage Transaction </div>
        <form class="confirmtransaction-form">
          <select class="selectuser-input" required>
          <option value="" disabled selected>Select User</option>
          ${this.users.value.map(user => `<option value="${user.uid}">${user.name}</option>`).join("")}
          </select>
          <button class="confirmtransaction-button"> Confirm Transaction </button>
        </div>
      </form>
    `)
  }
  addListeners() {
    this.targetElement.querySelector(".confirmtransaction-form").addEventListener("submit", this.confirmTransaction);
    this.targetElement.querySelector(".selectuser-input").addEventListener("change", this.setCurrentUser);
  }
}

// Component lists products in current users cart
class CartList extends Component {
  clearCart() {
    this.carts.setValue({ ...this.carts, [this.currentUser.id]: [] })
  }
  template() {
    return (`
      <div class="title"><p class="productname">Product</p><p class="price">Price</p><p class="stock">Amount</p><p class="total">Total</p></div>
      <ul class="productlist">
        ${this.currentUser.value ? (this.carts.value[this.currentUser.id] && this.carts.value[this.currentUser.id].length > 0 ? this.carts.value[this.currentUser.id].map(cartItem => `<li>${new CartListItem({ cartItem, parentComponent: this }).target()}</li>`).join("") + "<button class='clearcart-button'>Clear Cart</button>" : "<div class='emptycart'> Cart is empty</div>") : ""}
      </ul >
      `)
  }
  addListeners() {
    if (this.carts.value[this.currentUser.id] && this.carts.value[this.currentUser.id].length > 0) {
      this.targetElement.querySelector(".clearcart-button").addEventListener("click", this.clearCart);
    }
  }
}

// Component CartList-item
class CartListItem extends Component {
  template() {
    return (`
      <p class="productname" > ${this.cartItem.product.name}</p>
      <p class="price">${this.cartItem.product.price} ₺</p>
      <p class="amount">${this.cartItem.amount}</p>
      <p class="totalcost">${this.cartItem.amount * this.cartItem.product.price}₺</p>
    `)
  }
}