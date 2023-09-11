frappe.ui.form.on("Purchase Order", "refresh", function (frm, cdt, cdn) {
    if (cur_frm.doc.docstatus == 1) {
        var grid_row = cur_frm.open_grid_row();
        cur_frm.add_custom_button(__('Send Mail'), function () {
            if (cur_frm.doc.items[0].sales_order) {
                var titles = "Purchase Order :" + cur_frm.doc.name;
                var email_list = get_email_list();
                var print_list = get_print_format(cur_frm.doc.doctype);
                var doctype = "Sales Order";
                var print_lists = get_print_format(doctype);
                var d = new frappe.ui.Dialog({
                    title: titles,
                    fields: [{
                        label: 'TO',
                        fieldname: 'recipients',
                        fieldtype: 'MultiSelect',
                        options: email_list
                    },
                    {
                        label: 'CC, BCC & EMAIL TEMPLATE',
                        fieldname: 'sec_1',
                        fieldtype: 'Section Break',
                        collapsible: 1
                    },
                    {
                        label: 'CC',
                        fieldname: 'cc',
                        fieldtype: 'MultiSelect',
                        options: email_list
                    },
                    {
                        label: 'BCC',
                        fieldname: 'bcc',
                        fieldtype: 'MultiSelect',
                        options: email_list
                    },
                    {
                        label: 'Email Template',
                        fieldname: 'email_template',
                        fieldtype: 'Link',
                        options: "Email Template",
                        onchange: function () {
                            var email_template = d.fields_dict.email_template.get_value();
                            var prepend_reply = function (reply) {
                                if (d.reply_added === email_template) {
                                    return;
                                }
                                var content_field = d.fields_dict.content;
                                var subject_field = d.fields_dict.subject;
                                var content = content_field.get_value() || "";
                                var subject = subject_field.get_value() || "";
                                var parts = content.split('<!-- salutation-ends -->');
                                if (parts.length === 2) {
                                    content = [reply.message, "<br>", parts[1]];
                                } else {
                                    content = [reply.message, "<br>", content];
                                }
                                content_field.set_value(content.join(''));
                                if (subject === "") {
                                    subject_field.set_value(reply.subject);
                                }
                                else {
                                    subject_field.set_value("");
                                    subject_field.set_value(reply.subject);
                                }
                                d.reply_added = email_template;
                            };
                            frappe.call({
                                method: 'frappe.email.doctype.email_template.email_template.get_email_template',
                                args: {
                                    template_name: email_template,
                                    doc: cur_frm.doc,
                                    _lang: d.get_value("language_sel")
                                },
                                callback: function (r) {
                                    prepend_reply(r.message);
                                },
                            });
                        }
                    },
                    {
                        label: '',
                        fieldname: 'sec_2',
                        fieldtype: 'Section Break',
                    },
                    {
                        label: 'Subject',
                        fieldname: 'subject',
                        fieldtype: 'Data',
                        default:
                            titles
                    }, {
                        label: '',
                        fieldname: 'sec_3',
                        fieldtype: 'Section Break',
                    },
                    {
                        label: 'Message',
                        fieldname: 'content',
                        fieldtype: 'Text Editor',
                        onchange: function () { frappe.utils.debounce(save_as_draft(this.value), 300) }
                    },
                    {
                        label: '',
                        fieldname: 'sec_3',
                        fieldtype: 'Section Break',
                    },
                    {
                        label: "Send me a copy",
                        fieldname: 'send_me_a_copy',
                        fieldtype: 'Check',
                    },
                    {
                        label: "Send Read Receipt",
                        fieldname: 'send_read_receipt',
                        fieldtype: 'Check',
                    },
                    {
                        label: "Attach Document Print",
                        fieldname: 'attach_document_print',
                        fieldtype: 'Check',
                        default: 1,
                        onchange: function () {
                            var ckb_status = $("input[data-fieldname='attach_document_print']").prop('checked');
                            if (ckb_status == true) {
                                d.set_df_property('select_print_format', 'hidden', 0);
                                d.set_df_property('select_print_formats', 'hidden', 0);
                                d.fields_dict.select_print_format.refresh();
                                d.fields_dict.select_print_formats.refresh();
                            }
                            else {
                                d.set_df_property('select_print_format', 'hidden', 1);
                                d.set_df_property('select_print_formats', 'hidden', 1);
                                d.fields_dict.select_print_format.refresh();
                                d.fields_dict.select_print_formats.refresh();
                            }
                        }
                    },
                    {
                        label: "Select Print Format",
                        fieldname: 'select_print_format',
                        fieldtype: 'Select',
                        options: print_list
                    },
                    {
                        label: "Select Languages",
                        fieldname: 'select_language',
                        fieldtype: 'Link',
                        options: "Language",
                        default: "English"
                    },
                    {
                        label: '',
                        fieldname: 'col_break',
                        fieldtype: 'Column Break',
                    },
                    {
                        label: "Select Attachments",
                        fieldname: "select_attachments",
                        fieldtype: "Attach"
                    },
                    {
                        label: "Sales Order",
                        fieldname: "sales_order",
                        fieldtype: "Link",
                        options: "Sales Order",
                        default: cur_frm.doc.items[0].sales_order,
                        read_only: 1
                    },
                    {
                        label: "Select Print Format",
                        fieldname: 'select_print_formats',
                        fieldtype: 'Select',
                        options: print_lists
                    },
                    {
                        label: "Select Languages",
                        fieldname: 'select_languages',
                        fieldtype: 'Link',
                        options: "Language",
                        default: "English"
                    },
                    ],
                    primary_action_label: 'Send',
                    primary_action(values) {
                        d.hide();
                        var attachments = [];
                        if (values.attach_document_print == 1) {
                            var print_settings = get_print_settings();
                            // console.log("print_settings-----------"+print_settings.with_letterhead);
                            attachments = [{
                                "print_format_attachment": 1,
                                "doctype": 'Purchase Order',
                                "name": cur_frm.doc.name,
                                "print_format": values.select_print_format,
                                "print_letterhead": print_settings.with_letterhead,
                                "lang": values.select_language
                            },
                            {
                                "print_format_attachment": 1,
                                "doctype": 'Sales Order',
                                "name": values.sales_order,
                                "print_format": values.select_print_formats,
                                "print_letterhead": print_settings.with_letterhead,
                                "lang": values.select_languages
                            }
                            ];
                        }
                        //var content = frappe.dom.remove_script_and_style(values['content']);
                        //console.log("send----------"+values.sender)
                        frappe.call({
                            method: "frappe.core.doctype.communication.email.make",
                            args: {
                                recipients: values.recipients,
                                cc: values.cc,
                                bcc: values.bcc,
                                subject: values.subject,
                                content: values.content,
                                doctype: cur_frm.doc.doctype,
                                name: cur_frm.doc.name,
                                send_email: 1,
                                print_html: "",
                                send_me_a_copy: values.send_me_a_copy,
                                print_format: "",
                                sender: values.sender,
                                sender_full_name: "",
                                attachments: attachments,
                                _lang: values.select_language,
                                read_receipt: values.send_read_receipt,
                                print_letterhead: print_settings.with_letterhead
                            },
                            async: false,
                            callback: function (r) {
                                email_list = r.message;
                            }
                        });
                    }
                });
                d.show();
            } else {
                frappe.throw("This " + cur_frm.doc.name + " Purchase Order is not linked with Sales Order ");
            }
        });
    }
});
function get_email_list() {
    var email_list = "";
    frappe.call({
        method: 'plastex.api.get_email_list',
        args: {
        },
        async: false,
        callback: function (r) {
            email_list = r.message;
        }
    });
    return email_list;
}

function get_print_format(doctype) {
    var print_list = "";
    frappe.call({
        method: 'plastex.api.get_print_format',
        args: {
            "doctype": doctype
        },
        async: false,
        callback: function (r) {
            print_list = r.message;
        }
    });
    return print_list;
}

function get_email_template(value) {
    var print_list = "";
    frappe.call({
        method: 'plastex.api.get_email_template',
        args: {
            "value": value
        },
        async: false,
        callback: function (r) {
            print_list = r.message;
        }
    });
    return print_list;
}

function html2text(html) {
    // convert HTML to text and try and preserve whitespace
    var d = document.createElement('div');
    d.innerHTML = html.replace(/<\/div>/g, '<br></div>') // replace end of blocks
        .replace(/<\/p>/g, '<br></p>') // replace end of paragraphs
        .replace(/<br>/g, '\n');
    let text = d.textContent;
    // replace multiple empty lines with just one
    return text.replace(/\n{3,}/g, '\n\n');
}

function save_as_draft(value) {
    if (value) {
        try {
            let message = value;
            message = message.split(frappe.separator_element)[0];
            localStorage.setItem(cur_frm.doctype + cur_frm.docname, message);
        } catch (e) {
            // silently fail
            console.log(e);
            console.warn('[Communication] localStorage is full. Cannot save message as draft');
        }
    }
}

function get_print_settings() {
    var print_list = "";
    frappe.call({
        method: 'plastex.api.get_print_settings',
        args: {
        },
        async: false,
        callback: function (r) {
            print_list = r.message;
        }
    });
    return print_list;
}