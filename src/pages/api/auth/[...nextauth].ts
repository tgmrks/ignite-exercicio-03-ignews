import { query as q } from 'faunadb'
import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"

import { fauna } from '../../../services/fauna'

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'read:user',
        }
      },
    }),
    // ...add more providers here
  ],
  jwt: {
    secret: process.env.SIGNING_KEY
  },
  callbacks: {
    async session({session}) {
      try {
        const userActiveSubscription = await fauna.query(
          q.Get(  
            q.Intersection([
              q.Match(
                q.Index('subscription_by_user_ref'),
                q.Select(
                  "ref",
                  q.Get(
                    q.Match(
                      q.Index('user_by_email'),
                      q.Casefold(session.user.email)
                    )
                  )
                )
              ),
              q.Match(
                q.Index('subscription_by_status'), "active"
              )
            ])
          )
        )
        return {...session,activeSubscription: userActiveSubscription}
      }
      catch {
        return {
          ...session, activeSubscription: null,
        }
      }
    },
    async signIn({ user, account, profile, email, credentials }) {
      //const signInEmail = user.email
      try {
        await fauna.query(
          q.If(
            q.Not(
              q.Exists(
                q.Match(
                  q.Index('user_by_email'), q.Casefold(user.email)
                )//Match 
              )//Exists
            ),//Not
            q.Create(
              q.Collection('users'), { data: { email: user.email } }
            ),//Create
            q.Get(
              q.Match(
                q.Index('user_by_email'),
                q.Casefold(user.email)
              )//Match 
            )//Get
          )//If
        )//query
        return true
      } catch {
        return false
      }
      // try {
      //   await fauna.query(
      //     q.Create(
      //       q.Collection('users'),
      //       { data: { signInEmail } }
      //       )
      //     )
      //     return true
      // } catch {
      //   return false
      // }
    },
  }
})