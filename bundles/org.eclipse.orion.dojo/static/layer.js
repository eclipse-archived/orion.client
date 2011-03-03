/*
	Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["orion.dojo"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["orion.dojo"] = true;
/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/

dojo.provide("orion.dojo");

dojo.require("dojo._base.json");  
dojo.require("dojo.io.iframe");  
dojo.require("dojo.hash");  
dojo.require("dojo.data.ItemFileReadStore");  

dojo.require("dijit.Dialog");  
dojo.require("dijit.form.ComboBox");  
dojo.require("dijit.form.CheckBox");  
dojo.require("dijit.form.TextBox");  
dojo.require("dijit.layout.BorderContainer");  
dojo.require("dijit.layout.ContentPane");  
dojo.require("dijit.form.Button");  
dojo.require("dijit.form.DropDownButton");  
dojo.require("dijit.form.FilteringSelect"); 
dojo.require("dijit.Menu"); 
dojo.require("dijit.MenuItem"); 
dojo.require("dijit.ProgressBar");  
dojo.require("dijit.TitlePane"); 
dojo.require("dijit.Tree");  
dojo.require("dijit.tree.ForestStoreModel");  
dojo.require("dijit.tree.TreeStoreModel");  
dojo.require("dijit._Widget");  
dojo.require("dijit._Templated");  

dojo.require("dojox.layout.ToggleSplitter");    
dojo.require("dojox.form.FileUploader");  

//These requires are our own widgets, they perhaps deserve their own layer
//which would need to be regenerated each build.
//dojo.require("widgets.eWebBorderContainer");   
//dojo.require("widgets.ImportDialog");  
//dojo.require("widgets.NewItemDialog");  
//dojo.require("widgets.OpenResourceDialog");  
//dojo.require("widgets.RegistryTree");  
//dojo.require("widgets.ExplorerTree"); 


}
