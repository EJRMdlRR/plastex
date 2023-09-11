from __future__ import unicode_literals
import frappe
from frappe import _, throw, msgprint, utils
from frappe.utils import cint, flt, cstr, comma_or, getdate, add_days, getdate, rounded, date_diff, money_in_words
from frappe.model.mapper import get_mapped_doc
from frappe.model.naming import make_autoname
from erpnext.utilities.transaction_base import TransactionBase
from erpnext.accounts.party import get_party_account_currency
from frappe.desk.notifications import clear_doctype_notifications
from datetime import datetime
from frappe.email.email_body import get_message_id
import sys
import os
import operator
import frappe
import json
import time
import math
import base64
import ast
# import schedule
# from frappe.email.queue import send_one
from frappe.email.doctype.email_queue.email_queue import send_now as ts_send_now


@frappe.whitelist()
def get_email_list():
	data = []
	email_list = frappe.db.sql("""select email_id from `tabEmail Account` """,as_dict=1)
	for em  in email_list:
		data.append(em.email_id)
	return data
@frappe.whitelist()
def get_print_format(doctype):
	print_list = []
	print_format = frappe.db.sql("""select name from `tabPrint Format` where doc_type = %s""",doctype,as_dict=1)
	for pr in print_format:
		print_list.append(pr.name)
	return print_list

@frappe.whitelist()
def get_template(value):
	template = frappe.get_value("Email Template", value , 'response')
	return template
@frappe.whitelist()
def get_email_template(value):
	template = frappe.get_list("Email Template", filters={"name":value} , fields=[ 'response','subject'])
	return template

@frappe.whitelist()
def get_print_settings():
	print_settings = frappe.get_doc("Print Settings", "Print Settings")
	return print_settings
@frappe.whitelist()
def send_now(value):
	value = json.loads(value)	
	frappe.db.set_value("Communication",value['name'], "sent_via_send_mail", 1 )

@frappe.whitelist()
def send():
	#f= open("/home/frappe/frappe-bench/apps/plastex/plastex/output.out","a+")
	email_queue = frappe.get_list("Email Queue", filters={"reference_doctype": "Purchase Order", "status":"Not Sent"}, fields=["name", "communication"])
	for email in email_queue:
		comm = frappe.get_value("Communication",email['communication'], "sent_via_send_mail")
		#f.write("comm----------------"+str(comm)+'\n')
		if comm ==1:
			#f.write("name----------------"+str(email['name'])+'\n')
			# send_one(email['name'], now=True)
			ts_send_now(email['name'])
