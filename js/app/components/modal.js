define([
	'knockout',
	'text!./modal.html',
	'../extensions/bindings/bootstrapModal'
], function (
	ko,
	view
) {
	function modal(params) {
		var self = this;

		const {
			showModal,
			modifiers = [],
			dialogExtraClasses = [],
			iconClass,
			title,
			template,
			data,
			backdropClosable = true,
			fade = ko.observable(true),
			templateWrapperClass = { element: 'modal-body', extra: 'modal-body' }
		} = params;

		this.showModal = showModal;
		this.dialogExtraClasses = dialogExtraClasses;
		this.iconClass = iconClass;
		this.title = title;
		this.template = template;
		this.data = data;
		this.fade = fade;
		this.backdropClosable = backdropClosable;
		this.templateWrapperClass = templateWrapperClass;
		this.modifiers = [ ...modifiers, backdropClosable ? null : 'unclosable' ];
	}

	var component = {
		viewModel: modal,
		template: view
	};

    ko.components.register('modal-popup', component);
	return component
});
