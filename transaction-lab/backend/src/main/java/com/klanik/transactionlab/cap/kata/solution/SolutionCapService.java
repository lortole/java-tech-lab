package com.klanik.transactionlab.cap.kata.solution;

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║              SOLUTION KATA CAP — NE PAS LIRE              ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Solution du kata CAP — les points clés à retenir :
 *
 * 1. En mode CP, refuser les requêtes sur B quand la partition est active.
 *    → C'est ce que fait CapNodeService.readFromB() avec le flag modeCp.
 *    → PostgreSQL en réplication synchrone fait exactement ça.
 *
 * 2. En mode AP, répondre avec la dernière valeur connue de B.
 *    → La donnée peut être obsolète (stale read).
 *    → Cassandra, DynamoDB font ça par défaut.
 *
 * 3. Réconciliation (eventual consistency) :
 *    Quand la partition est résolue, B doit rattraper A.
 *    Stratégies possibles :
 *    a) Dernier écriture gagne (Last Write Wins) — timestamp ou vector clock
 *    b) Merge conflict — l'application décide (ex: CRDT)
 *    c) Read repair — lors de la prochaine lecture, A "répare" B
 *
 * 4. PACELC — en fonctionnement NORMAL (sans partition) :
 *    Il faut aussi choisir entre Latence et Cohérence.
 *    Cassandra EL : répond vite mais peut être obsolète.
 *    PostgreSQL EC : attend la réplication synchrone, latence plus haute.
 *
 * La démo dans CapNodeService simule la réconciliation simple :
 * quand togglePartition(false) est appelé, B copie intégralement l'état de A.
 * En production, ce serait un processus de replication asynchrone (ex: WAL shipping).
 */
public class SolutionCapService {
    // Voir CapNodeService.java pour l'implémentation complète.
    // Ce fichier existe uniquement pour refermer la boucle pédagogique.
}