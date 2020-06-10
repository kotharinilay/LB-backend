import time

from app.managers.pika_consumer import PikaConsumer


class PikaReconnectingConsumer(object):
    """This is an example consumer that will reconnect if the nested
    PikaConsumer indicates that a reconnect is necessary.
    """

    def __init__(self, amqp_url, msg_callback):
        self._reconnect_delay = 0
        self._amqp_url = amqp_url
        self.msg_callback = msg_callback
        self._consumer = PikaConsumer(self._amqp_url, self.msg_callback)

    def run(self):
        while True:
            try:
                self._consumer.run()
            except KeyboardInterrupt:
                self._consumer.stop()
                break
            self._maybe_reconnect()

    def _maybe_reconnect(self):
        if self._consumer.should_reconnect:
            self._consumer.stop()
            reconnect_delay = self._get_reconnect_delay()
            print('Reconnecting after %d seconds' % reconnect_delay)
            time.sleep(reconnect_delay)
            self._consumer = PikaConsumer(self._amqp_url, self.msg_callback)

    def _get_reconnect_delay(self):
        if self._consumer.was_consuming:
            self._reconnect_delay = 0
        else:
            self._reconnect_delay += 1
        if self._reconnect_delay > 30:
            self._reconnect_delay = 30
        return self._reconnect_delay
