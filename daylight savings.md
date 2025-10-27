October 26 (BST): London 6:00 AM = UTC 5:00 AM = HKT 1:00 PM (5:00 + 8 = 13:00).
October 27 (GMT): London 6:00 AM = UTC 6:00 AM = HKT 2:00 PM (6:00 + 8 = 14:00).

From Hong Kong's viewpoint, the job shifts forward by 1 hour on October 27 due to the UK's DST end. It runs at 1:00 PM HKT on October 26 and 2:00 PM HKT on October 27 (and 2:00 PM HKT thereafter until the next DST start in March 2026).
If your server is in Hong Kong (or you need HKT-local scheduling), you could set the timezone to Asia/Hong_Kong and adjust the cron time to 0 14 * * * for 2:00 PM HKT—but since you specified London time, the above reflects the equivalent execution time. If this doesn't match your setup (e.g., if using node-cron), provide more details for troubleshooting!
