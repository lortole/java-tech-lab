package com.klanik.transactionlab.saga.publisher;

public interface EventPublisher {
    void publish(String topic, String key, Object event);
}
