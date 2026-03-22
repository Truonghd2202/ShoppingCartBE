import { Collection, Db, MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import User from '~/models/User.schema'
import RefreshToken from '~/models/refreshToken.schema'
dotenv.config()
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@beshoppingcartk20.fqenjet.mongodb.net/?appName=beShoppingCartK20`

class DatabaseServices {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }
  //method
  async connect() {
    try {
      //kết nối với server MongoDB
      // Connect the client to the server	(optional starting in v4.7)
      // await client.connect()
      // kết nối với database nếu được thì ping về 1
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (err) {
      console.error(err)
      throw err
    }
  }
  //method connect đến Collection users
  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USERS_COLLECTION as string)
  }
  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string)
  }
}
//tạo instance dependency injection pattern tránh hiện tượng
//tạo ra nhiều injection cùng chức năng
let databaseServices = new DatabaseServices()
export default databaseServices
