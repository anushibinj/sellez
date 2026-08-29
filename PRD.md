# Project SellEZ

## Actors

- Superadmin
- Community admin
- Community member

## Functional requirements

App requirement

- When a logged out user visits the site, they should see the landing page which explains about the app briefly. And show an action button to enter their community's marketplace.
- Make the application's frontend design "loud" about the privacy focus. Mention in places where appropriate that their id/info is not being shared with anyone else (for example, when starting a chat with some other user, when posting an ad listing, etc.)
- For every transaction in the app, there should be e-mail notifications for involved users.
- For every transaction, there should be detailed audit logs that the super admin and community admin can see.
- Users should be authorized using e-mail OTP. There is no other way to sign up 100s of different organization types. Once the user logs in, the browser session should be persisted until they manually log out. When user signs up for the first time, ask their name (mark it as optional).
- The user's organization/community/domain should be based on the email domain. That is the only source of truth for any user's community info. If they login with a user@company.com domain, they belong to the company.com community.

As a superadmin,

- Mark a community member as community admin

As a community member,

- I should be able to post listings (ads)
- I should be able to contact listing-owners via in-app chat
- My identity should not be revealed to anyone within the application - even the community admin - regardless of whether I am selling or buying.
- Once a listing is sold, the respective chats should automatically show a alert saying "This product has been marked as sold"
- I should be able to revoke a listing that is currently in the review state
- I should be allowed to "plead against" a ban to present a use case that I was banned inappropriately. The super admins should be allowed to review the case.
- I should be able to share any product listing via URLs
- I should have a workflow to become a community admin if there are no community admins for my community.
- I should be allowed to rate other community members after I buy stuff from them.
- I should be allowed to report other community members (from chat or from their ad listings)

As a community admin,

- I should see a list of ad listings in my community - sold/needs review/open for sale.
- I should be able to approve items for sale that were drafted by my community users
- I should be able to ban community members in a fine-grained manner like "ban from posting", "ban from chatting", etc. And the ban should always have a tenure of X days upto 10 days. And the community member should be auto-unbanned after those X days.

## Tech Stack

- Backend - Spring Boot with Flyway for databse
- Frontend - React JS (if there are better SSR frameworks, choose them instead)
- Design - impeccable design skill, tailwind for components
- Database - PostgreSQL
- Message Queue - Kafka
- Notification service - AWS Simple Notification Service (SNS)