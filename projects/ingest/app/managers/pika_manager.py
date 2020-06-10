#!/usr/bin/env python
from threading import Thread

import config

from app.managers.pika_publisher import PikaPublisher
from app.managers.pika_reconnecting_consumer import PikaReconnectingConsumer


class PikaManager(Thread):
    def __init__(self, consumer_callback):
        Thread.__init__(self)
        self.consumer = PikaReconnectingConsumer(
            amqp_url=config.AMQP_CONSUMER_URL,
            msg_callback=consumer_callback)
        self.producer = PikaPublisher(
            amqp_url=config.AMQP_PRODUCER_URL)

    # self.consumer = PikaReconnectingConsumer(amqp_url = 'amqp://guest:guest@172.17.0.3:5672/%2F', msg_callback = consumer_callback )
    # self.producer = PikaPublisher(amqp_url = 'amqp://guest:guest@172.17.0.3:5672/%2F')

    def run(self):
        self.consumerThread = Thread(target=self.consumer.run)
        self.producerThread = Thread(target=self.producer.run)

        self.consumerThread.start()
        self.producerThread.start()

        self.consumerThread.join()
        self.producerThread.join()

    def send_message(self, status, file, client_id, UUID):
        message = {}
        message['status'] = status
        message['segmentUri'] = file
        message['client_id'] = client_id
        message['uuid'] = UUID

        self.producer.queue_message(message)
