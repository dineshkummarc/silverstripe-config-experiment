/**
 * File: LeftAndMain.AddForm.js
 */
(function($) {
	$.entwine('ss', function($){
		/**
		 * Class: #Form_AddForm
		 * 
		 * Simple form with a page type dropdown
		 * which creates a new page through #Form_EditForm and adds a new tree node.
		 * 
		 * Requires:
		 *  ss.i18n
		 *  #Form_EditForm
		 */
		$('#Form_AddForm').entwine({
			/**
			 * Variable: Tree
			 * (DOMElement)
			 */
			Tree: null,
			
			/**
			 * Variable: OrigOptions 
			 * (Array) Map of <option> values to an object of "title" and "value"
			 */
			OrigOptions: null,
	
			/**
			 * Variable: NewPages 
			 * (Array) Internal counter to create unique page identifiers prior to ajax saving
			 */
			NewPages: [],
	
			/**
			 * Constructor: onmatch
			 */
			onmatch: function() {
				var self = this, typeDropdown = this.find(':input[name=PageType]');
		
				Observable.applyTo(this[0]);
		
				var tree = jQuery('#sitetree')[0];
				this.setTree(tree);
				
				// Event bindings
				jQuery(tree).bind('selectionchanged', function(e, data) {self.refresh(data.node);});
				typeDropdown.bind('change', function(e) {self.refresh();});
				// TODO Bind on tree initialization to set dropdown for selected node
				
				// Store original page type options (they might get filtered to "allowed_children") later on
				// TODO Better DOM element serialization (jQuery 1.4?)
				var opts = {};
				typeDropdown.find('option').each(function(el) {
					opts[$(this).val()] = {html:$(this).html(), value: $(this).val()};
				});
				this.setOrigOptions(opts);
				
				this._super();
			},
	
			/**
			 * Function: onsubmit
			 * 
			 * Parameters:
			 *  (Event) e
			 */
			onsubmit: function(e) {
				var newPages = this.getNewPages();
				var tree = this.getTree();
				var parentID = (tree.firstSelected()) ? tree.getIdxOf(tree.firstSelected()) : 0;

				// TODO: Remove 'new-' code http://open.silverstripe.com/ticket/875
				if(parentID && parentID.substr(0,3) == 'new') {
					alert(ss.i18n._t('CMSMAIN.WARNINGSAVEPAGESBEFOREADDING'));
				}
		
				if(tree.firstSelected() && jQuery(tree.firstSelected()).hasClass("nochildren")) {
					alert(ss.i18n._t('CMSMAIN.CANTADDCHILDREN') );
				} 
		
				// Optionally initalize the new pages tracker
				if(!newPages[parentID] ) newPages[parentID] = 1;

				// default to first button
				var button = jQuery(this).find(':submit:first');
				button.addClass('loading');
		
				// collect data and submit the form
				var data = jQuery(this).serializeArray();
				data.push({name:'Suffix',value:newPages[parentID]++});
				data.push({name:button.attr('name'),value:button.val()});
				// TODO Should be set by hiddenfield already
				jQuery('#Form_EditForm').entwine('ss').loadForm(
					jQuery(this).attr('action'),
					function() {
						button.removeClass('loading');
					},
					{type: 'POST', data: data}
				);
		
				this.setNewPages(newPages);

				return false;
			},
			
			/**
			 * Function: refresh
			 * 
			 * Parameters:
			 *  (DOMElement) selectedNode
			 */
			refresh: function(selectedNode) {
				// Note: Uses siteTreeHints global
				var tree = this.getTree(), 
					origOptions = this.getOrigOptions(), 
					dropdown = this.find('select[name=PageType]');
				if(!selectedNode) selectedNode = tree.firstSelected();

				// Clear all existing <option> elements
				// (IE doesn't allow setting display:none on these elements)
				dropdown.find('option').remove();
				
				// Find allowed children through preferences on node or globally
				var allowed = [];
				if(selectedNode) {
					if(selectedNode.hints && selectedNode.hints.allowedChildren) {
						allowed = selectedNode.hints.allowedChildren;
					} else {
						// Fallback to globals
						allowed = (typeof siteTreeHints !== 'undefined') ? siteTreeHints['Root'].allowedChildren : [];
					}
					
					// Re-add all allowed <option> to the dropdown
					for(i=0;i<allowed.length;i++) {
						var optProps = origOptions[allowed[i]];
						if(optProps) dropdown.append($('<option value="' + optProps.value + '">' + optProps.html + '</option>'));
					}
				} else {
					// No tree node selected, reset to original elements
					$.each(origOptions, function(i, optProps) {
						if(optProps) dropdown.append($('<option value="' + optProps.value + '">' + optProps.html + '</option>'));
					});
				}
				
				// TODO Re-select the currently selected element
				
				// Disable dropdown if no elements are selectable
				if(allowed) dropdown.removeAttr('disabled');
				else dropdown.attr('disabled', 'disabled');
				
				// Set default child (optional)
				if(selectedNode.hints && selectedNode.hints.defaultChild) {
					dropdown.val(selectedNode.hints.defaultChild);
				}
		
				// Set parent node (fallback to root)
				var parentID = tree.getIdxOf(selectedNode);
				this.find(':input[name=ParentID]').val(parentID ? parentID : 0);
			}
		});
	});
}(jQuery));