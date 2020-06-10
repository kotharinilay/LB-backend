class SuccessResponse {
  constructor(payload) {
    this.payload = payload;
    this.cursors = {};

    return this;
  }

  nextCursor(cursor) {
    this.cursors.nextCursor = cursor;
    return this;
  }

  previousCursor(cursor) {
    this.cursors.previousCursor = cursor;
    return this;
  }

  build() {
    const result = {
      status: 'ok',
      payload: this.payload
    };

    if (this.cursors.nextCursor || this.cursors.previousCursor) {
      const cursors = {};

      if (this.cursors.nextCursor) {
        cursors.next = this.cursors.nextCursor;
      }
      if (this.cursors.previousCursor) {
        cursors.previous = this.cursors.previousCursor;
      }

      result.payload.paging = {
        cursors: cursors
      };
    }

    return result;
  }
}

module.exports = SuccessResponse;
