// idées bonus via : https://fr.wikipedia.org/wiki/Bomberman
// nb to hexa: (3840).toString(16).padStart(2, '0')

// TODO eteindre un bloc puis allumer un autre, genre perso qui se déplace
// TODO svg objs, pour ajouter bonus
// TODO maybe problem: when explode and fire, and explode and fire, fire reste en place

let xw= [], // world hexas   b11 bedrock, b10 resist2, b9 resist1, b8 mur,   b7 rbomb, b6 bomb, b5 explod, b4 oqp,   b3 ?, b2 dy, b1 dx, b0 perso

tmp,

xme= { x:0, y:0, radius:2, life:1, bombs:1, rbomb:{nb:0,pos:null} };



// secu, null-> overflow, true-> ok, false-> some present { bins 0 is 0 (ex: 1101 & datas xx1x = problem, 1011 & datas x0xx = ok) }
const is0= ( x, y, bins )=>{   if( x<0 || x>=xw_w || y<0 || y>=xw_h ){ return null; }   return (xw[y][x]&(bins^0xfff))<1;   },

_sel= val=> document.querySelector(val),

xw_w = 13,

xw_h = 7,



// add or remove bins from map, edit display html.
set= (x,y,bin_add,bin_val,add_val=null)=>{ bin_add?  (xw[y][x] |= bin_val):  (xw[y][x] &= bin_val);   add_val&&( xw[y][x] |= add_val );   set_p2.f( x, y ); },



// by each bin, set classes
set_p2= {

n:0,
out:"",
sel:0,
bins:0,

f: (x,y)=>{   set_p2.sel= _sel(".tile[loca='"+ x +"_"+ y +"']");   set_p2.n= 0;   set_p2.out= "";   set_p2.bins= xw[y][x];   while( set_p2.bins>0 ){   if( set_p2.bins&1 ){ set_p2.out+= " t_"+ set_p2.n; }   set_p2.bins= set_p2.bins/2|0;   set_p2.n++;   }   set_p2.sel.className= "tile"+ set_p2.out;   }
},



xw_exec= ( at_start_line= _=>{}, at_tile= _=>{}, at_end_line= _=>{} )=>{   at_start_line(0);   for( let x= 0, y= 0; y < xw_h; x++ ){   if( x >= xw_w ){   at_end_line();   y++;   if( y >= xw_h ){ continue; }   x= 0;   at_start_line(y);   }   at_tile( x, y );   }   },


	
// TODO 0x050 ou 0x090 pour rbomb
pose_bmb= (x,y)=>{

	if( xme.bombs<1 || is0( x, y, 0xfcf )==false ){ return; }
	set( x, y, true, 0x050 );   xme.bombs--;
	setTimeout(() => {   bmb_destroy_4dir( x, y );   setTimeout(() => { bmb_kalm_4dir( x, y ); xme.bombs++; }, 300);   }, 2000);
},



// dans les 4 dir : mettre le feu partout sauf si touche brique alors stop progression
bmb_destroy_4dir= ( x, y )=>{

	explo_fire( x, y );

	let dirs= [ 1, 1, 1, 1 ];
	for( let dist= 1; dist<=xme.radius; dist++ ){
		// if blocage (null ou incramable)  ->  =0
		// else (if pas vide alors =0) +cramer
		if( dirs[0] ){ explo_fire( x+dist, y ) &&( dirs[0]= 0 ); }
		if( dirs[1] ){ explo_fire( x, y-dist ) &&( dirs[1]= 0 ); }
		if( dirs[2] ){ explo_fire( x-dist, y ) &&( dirs[2]= 0 ); }
		if( dirs[3] ){ explo_fire( x, y+dist ) &&( dirs[3]= 0 ); }
	}
},



// dans les 4 dir : eteindre le feu, delete blocs
bmb_kalm_4dir= ( x, y )=>{

	explo_end.f( x, y );

	let dirs= [ 1, 1, 1, 1 ];
	for( let dist= 1; dist<=xme.radius; dist++ ){
		if( dirs[0] ){ explo_end.f( x+dist, y ) &&( dirs[0]= 0 ); }
		if( dirs[1] ){ explo_end.f( x, y-dist ) &&( dirs[1]= 0 ); }
		if( dirs[2] ){ explo_end.f( x-dist, y ) &&( dirs[2]= 0 ); }
		if( dirs[3] ){ explo_end.f( x, y+dist ) &&( dirs[3]= 0 ); }
	}
},



// retourne problem (genre bedrock ou overflow ou autre que air) | hit player, add fire
explo_fire= (x,y)=>{

	if( !is0( x, y, 0x7ff ) ){ return true; }
	if( is0( x, y, 0xffe )==false ){ touched(); }
	set( x, y, false, 0xf3f, 0x030 );
	return is0( x, y, 0x0f0 )==false;
},



// secu, puis si bloc alors destroy sinon vire tout, puis retourne si blocage
explo_end= {

futu: null,

f: (x,y)=>{

	if( is0( x, y, 0xfef )!=false ){ return true; }
	if( is0( x, y, 0x0f0 )==false ){
		explo_end.futu= 0x000; // TODO remplacer par un bonus
		// continuer tbomb (on choppe ++, on pose --rbomb (pas bomb) donc memo pos x y, puis on declenche (boum + memo pos null) )
		// xme.radius++
		// xme.bombs++;
		// penetrator (pete 2blocs si direct successifs)
		// invincible pendant 10 secondes (clignotte vite)
		// armure : supporte une explosion
		// une vie
		// apres: si touché par un ennemi, il explose et nous on perd une vie, et on est "malade" (vitesse moindre, touches inversées, déplacement que de dos..)
		set( x, y, false, 0x000, explo_end.futu );
	}else{ set( x, y, false, 0x000 ); }
	return false;
}
},



touched= _=>{

	xme.life--;
	if( xme.life<1 ){
		set( xme.x, xme.y, false, 0xff0 );
	}
},



init= _=>{

	// create map, with new line init, new tile type from position, and display.
	tmp= "";
	xw_exec(
		y=>{   xw[y] = [];   tmp= "";   },
		(x,y)=>{
			// TODO 0x100 to bloc parfois tres solide
			xw[y][x]= x==xme.x&&y==xme.y? 0x001: y%2==1&&x%2==1? 0x900: (Math.abs(x-xme.x)<2&&Math.abs(y-xme.y)<2||Math.random()>.5)? 0x000: 0x100;
			tmp+= "<div class='tile' loca='"+ x +"_"+ y +"'></div>";   setTimeout( _=>{ set_p2.f( x, y ); }, 20 );
		},
		_=>{   _sel("main").innerHTML+= "<div class='flex'>"+ tmp +"</div>";   }
	);

	// remove player, move, put player.
	document.addEventListener("keydown", e=>{
		set( xme.x, xme.y, false, 0xff0 );
		switch( e.keyCode ){
			case 37: // Gauche
				xme.life>0 && is0( xme.x-1, xme.y, 0xeef ) &&( xme.x-- );
			break;
			case 38: // Haut
				xme.life>0 && is0( xme.x, xme.y-1, 0xeef ) &&( xme.y-- );
			break;
			case 39: // Droit
				xme.life>0 && is0( xme.x+1, xme.y, 0xeef ) &&( xme.x++ );
			break;
			case 40: // Bas
				xme.life>0 && is0( xme.x, xme.y+1, 0xeef ) &&( xme.y++ );
			break;
			case 32: // Espace
				pose_bmb( xme.x, xme.y ); // {-{xme.life>0 && }} mdr, on peut continuer à poser des bombes, même mort xD
			break;
			case 96: // numpad0 cheat dev
				xme.rbomb.nb++;
			break;
		}
		xme.life>0 && set( xme.x, xme.y, true, 0x001 );
	});

};



window.addEventListener("load",init,false);
