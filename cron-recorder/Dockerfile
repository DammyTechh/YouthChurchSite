FROM debian:bookworm-slim

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
      ffmpeg curl ca-certificates tzdata && \
    rm -rf /var/lib/apt/lists/*

ENV TZ=Africa/Lagos

WORKDIR /app
COPY record-and-upload.sh .
RUN chmod +x record-and-upload.sh

CMD ["./record-and-upload.sh"]
