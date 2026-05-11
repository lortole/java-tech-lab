package com.klanik.transactionlab.saga.events;

/**
 * Registre centralisé des topics Kafka utilisés par la SAGA.
 *
 * <p>Topologie des topics :</p>
 * <pre>
 *   commande-creee         → Inventaire réserve
 *   articles-reserves      → Paiement débite
 *   paiement-effectue      → Notification envoie l'email ✅
 *
 *   articles-indisponibles → Order annule (stock insuffisant)
 *   paiement-echoue        → Inventaire libère le stock 🔄
 *   articles-liberes       → Order annule la commande 🔄
 * </pre>
 */
public final class SagaTopics {

    // Flux nominal
    public static final String COMMANDE_CREEE      = "commande-creee";
    public static final String ARTICLES_RESERVES   = "articles-reserves";
    public static final String PAIEMENT_EFFECTUE   = "paiement-effectue";

    // Flux de compensation
    public static final String ARTICLES_INDISPONIBLES = "articles-indisponibles";
    public static final String PAIEMENT_ECHOUE        = "paiement-echoue";
    public static final String ARTICLES_LIBERES        = "articles-liberes";

    private SagaTopics() {}
}