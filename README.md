# 🚀 Space Bots

Space Bot is an online multiplayer space game that is played through an API.

## Setup

To setup everything:

```
npm install
docker-compose up -d
npm run generate-schema
npm run db-sync
npm run seed-dev-data
```

The dev data contains the user `Longwelwind` with the API token `longwelwind`.

To launch the game locally:

```
npm run dev
```

The website will be up in `http://localhost:8080/`

You can access the OpenAPI spec by going to: `http://localhost:8080/docs/`

### Run the tests

```
npm run test
```

## Contributions

This project is open, but closed to contributions. I'm putting it out there to serve as learning materials for those who want to code something similar, but it does. You can make pull requests if you'd like to see a feature in the game, but don't expect to have it merged. This project serves as a zen garden for me and I would like to see people contribute to it, but at the same time, I don't specially want to deal with the hassle associated with it.

## Architecture

[To be filled]

### Order in which to acquire locks

Database locks are heavily used to prevent race condition from corrupting the data inside the database. When coding endpoints, the following order should be followed to prevent deadlocks:

-   User
-   Fleet
-   Module
-   Market resources (a special custom lock is done for this one)
-   Inventory
