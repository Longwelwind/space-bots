# A finir pour une release

-   [x] Finir les routes
    -   [x] Transférer des ressources/vaisseaux à une autre flotte
    -   [x] Vente directe
    -   [x] Acheter des vaisseaux de minages
-   [] Finir l'OpenAPI de tous ce beau monde
-   [x] Créer 5 ressources
-   [x] Créer une carte de ~20 systèmes

## How to

Update spec

```
doctl apps update db02eb4a-12ec-4bd8-9340-21d26454da2c --spec .do/app.yml
```

## Posts

### Reddit

```
Hello!
Space Bots is a multiplayer online game where players order ships around the universe to mine goods and sell them to gain money. The twist is there's no UI, just an HTTP API. Fire up your best HTTP client and start mining and selling goods accross the universe.

At the moment, it's in beta and I've implemented only the features to get a basic game (fleet movement, mining asteroids, selling resources and buying ships). My goal is to expand on the mechanics to create a game with a player-driven economy, supply chain automation, indutries, PvP with territory control, among other things.

There's a [Discord](https://discord.gg/ATeDzSy2Wu), don't hesitate to share any feedback or ask any question!
```
