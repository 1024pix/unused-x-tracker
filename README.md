# Unused X Tracker

Ce projet est un outil permettant de détecter les choses non utilisées dans un projet.

La seule fonctionnalité pour le moment est de détecter les fonctions exportées d'un dossier qui ne sont pas utilisées
dans un autre dossier.

Les usages liés à Pix sont de :
- détecter les fonctions exportées par les fichiers de `repositories` qui ne sont pas utilisées
ni dans le dossier `domain`
- détecter les use-cases qui ne sont pas utilisés.


## Usage

Pré-requis : NodeJS 18

```bash
npm ci
```

```
node bin/main.js 
```
