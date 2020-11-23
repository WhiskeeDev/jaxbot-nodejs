# Jax API Error Codes
All codes are prefixed with `ERR-` followed by a number, probably a better method or even a standard for this but this is litterally what I just came up with so we'll go with this for now.

## ERR-100
**Unwhitelisted IP/host**
This IP/host was not added to the `http_valid_hosts` environment variable.

## ERR-110
**No Client Token was provided**
no `jax-client-token` header was provided.

## ERR-120
**Invalid Client Token**
The `jax-client-token` header was wrong.

## ERR-130
**Disabled Client Token**
The `jax-client-token` provided has been disabled in the database.

## ERR-130
**Disabled Client Token**
The `jax-client-token` provided has been disabled in the database.

## ERR-200
**No Discord Access Token was provided**
The user's Discord access token must be provided to the API as an Authorization Bearer token.

## ERR-300
**Not a member of TopHat**
The user (found by the Discord Access Token) is not a registered member in the TopHat database.

## ERR-900
**Blacklisted IP**
I intentionally set this error number further away from whitelist messages to make it distinct, the idea is to maybe catch people out with this ;)

## ERR-1000
**Unknown/Unexpected Error**
This is a genuine unknown issue, as soon as one of these happens we should invest it *ASAP* so we can figure out the cause, work on a fix and log an actual error code/message with it.
