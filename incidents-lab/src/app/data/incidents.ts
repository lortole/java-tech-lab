export interface Incident {
  id: string;
  code: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  stack: string;
  context: string;
  rootCause: string;
  solution: string;
  lesson: string;
}

export const incidents: Incident[] = [
  {
    id: 'inc-001',
    code: 'INC-001',
    title: '@ConditionalOnBean evalue trop tot',
    severity: 'HIGH',
    stack: 'Spring Boot',
    context: 'KafkaEventPublisher avec @ConditionalOnBean(KafkaTemplate.class) et MockEventPublisher avec @ConditionalOnMissingBean ne s\'activaient pas dans le bon ordre au demarrage de l\'application.',
    rootCause: '@ConditionalOnBean et @ConditionalOnMissingBean sont evalues pendant le post-processing des BeanDefinitions, avant que tous les beans soient enregistres. Le resultat est non deterministe selon l\'ordre de scan des classes.',
    solution: 'Remplacer par @Profile("local") sur le MockEventPublisher et @Profile("!local") sur le KafkaEventPublisher. Les profiles sont resolus apres le chargement complet du contexte.',
    lesson: 'Ne jamais utiliser @ConditionalOnMissingBean pour des beans applicatifs definis dans le meme contexte. Reserver @ConditionalOnBean et @ConditionalOnMissingBean aux auto-configurations de librairies tierces.'
  },
  {
    id: 'inc-002',
    code: 'INC-002',
    title: 'vercel.json outputDirectory en conflit avec UI Vercel',
    severity: 'MEDIUM',
    stack: 'Vercel + Angular 18',
    context: 'vercel.json contenait "outputDirectory": "dist/frontend/browser" ET le champ Output Directory etait renseigne dans l\'UI Vercel. Conflit silencieux : le deploiement echouait ou servait le mauvais dossier selon la version du CLI.',
    rootCause: 'Vercel fusionne les deux configurations mais vercel.json prend la priorite sur l\'UI, creant des incoherences selon la version du CLI Vercel utilisee en CI.',
    solution: 'Supprimer vercel.json entierement. Tout configurer dans l\'UI Vercel : Root Directory = virtual-threads-lab/frontend, Output Directory override = dist/frontend/browser.',
    lesson: 'Choisir UNE seule source de verite pour la config Vercel. Ne jamais mixer vercel.json et les settings de l\'UI Vercel pour les memes champs de configuration.'
  },
  {
    id: 'inc-003',
    code: 'INC-003',
    title: 'Angular 18 outputPath browser sous-dossier -> 404 Vercel',
    severity: 'HIGH',
    stack: 'Angular 18 + Vercel',
    context: 'Vercel configure pour servir dist/frontend mais Angular 18 ecrit le build dans dist/frontend/browser. Toutes les pages retournaient 404 apres le deploiement.',
    rootCause: 'Depuis Angular 17+, le build output est place dans un sous-dossier browser/ (et server/ pour le SSR). Angular 16 et avant mettait les fichiers a la racine de dist/.',
    solution: 'Dans l\'UI Vercel, override du champ Output Directory avec la valeur dist/frontend/browser. Vercel sert alors le bon repertoire.',
    lesson: 'Apres chaque upgrade Angular majeur, verifier le chemin de build output dans angular.json -> projects.[name].architect.build.options.outputPath. Depuis Angular 17, toujours pointer sur le sous-dossier browser/.'
  },
  {
    id: 'inc-004',
    code: 'INC-004',
    title: 'Railway : port expose != port ecoute -> 502 Bad Gateway',
    severity: 'HIGH',
    stack: 'Spring Boot + Railway',
    context: 'Spring Boot configure sur server.port=8080 mais Railway exposait le port 8081 dans les Settings. Toutes les requetes HTTP retournaient 502 Bad Gateway.',
    rootCause: 'Railway route le trafic externe vers le port declare dans ses Settings -> Networking. Si l\'application ecoute sur un port different, Railway ne trouve aucun service a proxifier et retourne 502.',
    solution: 'Aligner le port Railway (Settings -> Networking -> Port) avec server.port dans application.properties. Solution preferee : utiliser server.port=${PORT:8080} pour absorber la variable injectee par Railway.',
    lesson: 'Toujours utiliser server.port=${PORT:8080} en production pour absorber automatiquement le port injecte par la plateforme. Cette pratique fonctionne sur Railway, Render, Heroku et toutes les plateformes PaaS.'
  },
  {
    id: 'inc-005',
    code: 'INC-005',
    title: 'Railway monorepo : Root Directory vide -> Railpack ne detecte pas le projet',
    severity: 'MEDIUM',
    stack: 'Railway + monorepo Java',
    context: 'Le repo GitHub est un monorepo multi-modules. Railway configure sans Root Directory -> Railpack scanne la racine du repo, ne trouve pas de pom.xml ni build.gradle a la racine -> build ignore ou erreur de detection.',
    rootCause: 'Railpack detecte le type de projet en cherchant des fichiers de build (pom.xml, build.gradle) a la racine du repertoire configure. Dans un monorepo, ces fichiers sont dans des sous-dossiers de module.',
    solution: 'Dans Railway -> Settings -> Source -> Root Directory, renseigner le chemin du sous-projet : ex. transaction-lab/backend. Railpack trouve alors le pom.xml et detecte correctement le projet Maven.',
    lesson: 'Sur Railway avec un monorepo, toujours configurer le Root Directory vers le sous-module backend. La regle est : un service Railway = un sous-dossier de module avec son propre fichier de build.'
  },
  {
    id: 'inc-006',
    code: 'INC-006',
    title: '@import vs @use dans Angular 18 SCSS -> erreur de compilation',
    severity: 'MEDIUM',
    stack: 'Angular 18 + SCSS',
    context: 'Utilisation de @use "styles/variables" as * dans styles.scss. Erreur de compilation Angular : SassError: This file is already being loaded, ou conflits de namespace lors du build ng build.',
    rootCause: 'Angular 18 compile les SCSS avec sass qui supporte @use, mais le systeme de chargement Angular injecte lui-meme certains fichiers globaux. La combinaison cree des conflits de namespace avec le module system @use.',
    solution: 'Utiliser @import "styles/variables" a la place de @use dans tous les fichiers SCSS. Malgre la depreciation de @import dans la spec Sass, c\'est la syntaxe stable et fiable avec Angular 18.',
    lesson: 'En Angular 18, @import est la voie sure pour les styles globaux. Attendre Angular 19+ ou la migration complete vers sass-embedded pour utiliser @use de maniere fiable dans un projet Angular.'
  }
];
