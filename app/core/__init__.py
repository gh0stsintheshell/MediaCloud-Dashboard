
import ConfigParser
import importlib

import flask
from flask.ext.assets import Environment, Bundle
import flask_login
from flask_cdn import CDN
import mediacloud
import mediacloud.api as mcapi
import pymongo
import logging, logging.handlers

import os.path

from raven.conf import setup_logging
from raven.contrib.flask import Sentry
from raven.handlers.logging import SentryHandler

# Load configuration
config = ConfigParser.ConfigParser()
current_dir = os.path.dirname(os.path.abspath(__file__))
base_dir = os.path.dirname(os.path.dirname(current_dir))
config.read(os.path.join(base_dir, 'app.config'))

logger = logging.getLogger(__name__)	# the mediameter logger

flapp = flask.Flask(__name__)

# setup logging
try:
    sentry_dsn = config.get('sentry', 'dsn')
    handler = SentryHandler(sentry_dsn)
    handler.setLevel(logging.ERROR)
    setup_logging(handler)
    Sentry(flapp, dsn=sentry_dsn)
except Exception as e:
    logger.info("no sentry logging")
    logger.error(e)
logging.basicConfig(level=logging.DEBUG)
mc_logger = logging.getLogger('mediacloud')
requests_logger = logging.getLogger('requests')

logger.info("---------------------------------------------------------------------------------------")

# Flask app config
if config.get('custom', 'use_cdn') == 'true':
    flapp.config['CDN_DOMAIN'] = 'd31f66kh11e0nw.cloudfront.net'
    CDN(flapp)
    flapp.config['FLASK_ASSETS_USE_CDN'] = True
flapp.secret_key = 'put secret key here'
flapp.config['SEND_FILE_MAX_AGE_DEFAULT'] = 7 * 24 * 60 * 60
assets = Environment(flapp)


# Create media cloud api
app_mc_key = config.get('mediacloud', 'key')
mc = mcapi.AdminMediaCloud(app_mc_key)
logger.info("Connected to MediaCloud with default key %s" % (app_mc_key))
logging.getLogger('MediaCloud').setLevel(logging.DEBUG)

# Create user login manager
login_manager = flask_login.LoginManager()
login_manager.init_app(flapp)

# Connect to db
host = config.get('database', 'host')
database = config.get('database', 'database')
db = pymongo.MongoClient(host)[database]
logger.info("Connected to DB %s@%s" % (database,host))

# Set up routes and content
import app.core.views

# Import tool-specific code
try:
    modules = config.get('custom', 'modules').split(',')
    modules = [m.strip() for m in modules]
    for m in modules:
        if len(m) > 0:
            importlib.import_module(m)
except ConfigParser.NoOptionError:
    pass
