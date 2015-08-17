# Source ui manager is used to change UI elements based on the selected source.

lolflavor = ->
  if $('#options_sr_source').val() != 'lolflavor'
    $('#options_sr_source').val('lolflavor')
    $('#sr_source_text').text($('.rift_source').find('[data-value="lolflavor"]').text())
    $('.rift_source').find('[data-value="championgg"]').attr('class', 'item')
    $('.rift_source').find('[data-value="lolflavor"]').addClass('selected active')

  $('#options_splititems').parent().addClass('disabled')
  $('#options_splititems').attr('disabled', 'disabled')

  $('#options_skillsformat').parent().addClass('disabled')
  $('#options_skillsformat').attr('disabled', 'disabled')

  $('#options_consumables').parent().addClass('disabled')
  $('#options_consumables').attr('disabled', 'disabled')

  $('#options_trinkets').parent().addClass('disabled')
  $('#options_trinkets').attr('disabled', 'disabled')


championgg = ->
  $('#options_splititems').parent().removeClass('disabled')
  $('#options_splititems').removeAttr('disabled', 'disabled')

  $('#options_skillsformat').parent().removeClass('disabled')
  $('#options_skillsformat').removeAttr('disabled', 'disabled')

  $('#options_consumables').parent().removeClass('disabled')
  $('#options_consumables').removeAttr('disabled', 'disabled')

  $('#options_trinkets').parent().removeClass('disabled')
  $('#options_trinkets').removeAttr('disabled', 'disabled')


module.exports = {
  championgg: championgg
  lolflavor: lolflavor
}
