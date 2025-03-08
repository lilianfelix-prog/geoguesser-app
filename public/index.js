var K,T,C=null,W=null,O=null;var J,Z=!0,X=0,Y=0,_=5;function U(){let j=new URLSearchParams(window.location.search),A=j.get("urllat"),q=j.get("urllng");return{urllat:A?parseFloat(A):null,urllng:q?parseFloat(q):null}}function y(){G(),K=new google.maps.Map(document.getElementById("map"),{center:{lat:0,lng:0},zoom:2,streetViewControl:!1,fullscreenControl:!1}),T=new google.maps.StreetViewPanorama(document.getElementById("street-view"),{position:{lat:0,lng:0},pov:{heading:0,pitch:0},zoom:1,addressControl:!1,showRoadLabels:!1}),K.addListener("click",(j)=>{if(Z&&j.latLng)N(j.latLng)}),$()}function G(){let j=document.createElement("div");j.className="game-controls",j.innerHTML=`
      <div class="game-info">
        <div id="score">Score: 0</div>
        <div id="round">Round: 1/${_}</div>
      </div>
      <button id="guess-btn" disabled>Make Guess</button>
      <button id="next-btn" disabled>Next Round</button>
    `,document.getElementsByClassName("controls-container")[0].appendChild(j),document.getElementById("guess-btn")?.addEventListener("click",B),document.getElementById("next-btn")?.addEventListener("click",$)}async function $(){b(),Z=!0,Y++,x();let j=document.getElementById("guess-btn"),A=document.getElementById("next-btn");j.disabled=!0,A.disabled=!0;try{let{urllat:q,urllng:H}=U();if(q!==null&&H!==null)J={lat:q,lng:H};else J=(await(await fetch("/api/location/random")).json()).actualLocation;let I=new google.maps.StreetViewService,V=5000,z=new google.maps.LatLng(J.lat,J.lng);I.getPanorama({location:z,radius:V},(Q,F)=>{if(F===google.maps.StreetViewStatus.OK)if(Q&&Q.location)T.setPano(Q.location.pano),T.setPov({heading:0,pitch:0}),T.setVisible(!0);else console.warn("No Street View found near this location.");else console.warn("No Street View found near this location.")})}catch(q){console.error("Error fetching location:",q),alert("Error fetching location. Please try again.")}}function N(j){if(C)C.setMap(null);C=new google.maps.Marker({position:j,map:K});let A=document.getElementById("guess-btn");A.disabled=!1}function b(){if(C)C.setMap(null),C=null;if(W)W.setMap(null),W=null;if(O)O.setMap(null),O=null}async function B(){if(!C){alert("Please select a location on the map first!");return}Z=!1;let j={lat:C.getPosition().lat(),lng:C.getPosition().lng()};try{let q=await(await fetch("/api/guess",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({guessLocation:j,actualLocation:J})})).json();X+=q.score,D(q.score,q.distance),w(j,J);let H=document.getElementById("next-btn");if(Y<_)H.disabled=!1;else setTimeout(()=>{alert(`Game over! Final score: ${X}. Play again?`),X=0,Y=0,$()},2000)}catch(A){console.error("Error calculating score:",A),alert("Error processing your guess. Please try again.")}}function w(j,A){let q=new google.maps.LatLng(Number(A.lat),Number(A.lng));W=new google.maps.Marker({position:q,map:K,icon:{url:"https://maps.google.com/mapfiles/ms/icons/green-dot.png"}}),O=new google.maps.Polyline({path:[{lat:j.lat,lng:j.lng},{lat:q.lat(),lng:q.lng()}],geodesic:!0,strokeColor:"#FF0000",strokeOpacity:1,strokeWeight:2}),O.setMap(K);let H=new google.maps.LatLngBounds;H.extend(new google.maps.LatLng(j.lat,j.lng)),H.extend(new google.maps.LatLng(A.lat,A.lng)),K.fitBounds(H)}function D(j,A){let q=document.getElementById("score");if(q)q.textContent=`Score: ${X} (+${j}) - Distance: ${Math.round(A)} km`}function x(){let j=document.getElementById("round");if(j)j.textContent=`Round: ${Y}/${_}`}window.initialize=y;
