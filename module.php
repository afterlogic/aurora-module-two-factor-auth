<?php

class TwoFactorModule extends AApiModule
{
	public $oApiTwofactorauthManager = null;
	
	public function init() 
	{
		parent::init();
		$this->oApiTwofactorauthManager = $this->GetManager();
	}
}
